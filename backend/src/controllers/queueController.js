const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');
const Service = require('../models/Service');
const Organization = require('../models/Organization');
const Counter = require('../models/Counter');
const User = require('../models/User');
const { generateNextToken } = require('../services/tokenGeneratorService');
const { calculateWaitTime } = require('../services/waitTimeService');
const { sendCustomerNotification } = require('../services/notificationService');
const { validateAndNormalizePhone } = require('../utils/phoneValidator');

// In-memory mutex locks to prevent race conditions during concurrent join requests
const joinLocks = new Map();

async function acquireJoinLock(key) {
  while (joinLocks.has(key)) {
    await joinLocks.get(key);
  }
  let release;
  const promise = new Promise(resolve => {
    release = resolve;
  });
  joinLocks.set(key, promise);
  return () => {
    joinLocks.delete(key);
    release();
  };
}

// Helper to get today's date string YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// Helper: Ensure or get today's Queue for a service
async function getOrCreateTodayQueue(serviceId, organizationId) {
  const today = getTodayString();
  let queue = await Queue.findOne({
    serviceId: String(serviceId),
    date: today
  });

  if (!queue) {
    queue = await Queue.create({
      organizationId,
      serviceId,
      date: today,
      status: 'active',
      currentToken: null,
      currentTokenNumber: 0,
      lastIssuedNumber: 0,
      createdAt: new Date().toISOString()
    });
  }

  return queue;
}

// POST /api/queues/join
async function joinQueue(req, res, next) {
  let releaseLock = null;
  try {
    const { serviceId, organizationId, customerName, customerPhone, notes } = req.body;
    const io = req.app.get('io');

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required.' });
    }

    const service = await Service.findById(serviceId);
    if (!service || service.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Service not found or is currently inactive.' });
    }

    const orgId = organizationId || service.organizationId;
    const org = await Organization.findById(orgId);
    if (!org || org.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Organization not found or is currently inactive.' });
    }

    const queue = await getOrCreateTodayQueue(serviceId, orgId);

    if (queue.status === 'closed') {
      return res.status(400).json({ success: false, message: 'This queue is closed for today.' });
    }

    // 1. Customer Name Validation (Same name must be allowed; cannot be empty)
    const rawCustomerName = customerName || (req.user ? req.user.name : '');
    if (!rawCustomerName || !rawCustomerName.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your name.' });
    }
    const finalCustomerName = rawCustomerName.trim();

    // 2. Phone Number Validation: Exactly 10 digits for Indian numbers, normalized
    const rawCustomerPhone = customerPhone || (req.user ? req.user.phone : '');
    const phoneValidation = validateAndNormalizePhone(rawCustomerPhone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number.'
      });
    }
    const normalizedPhone = phoneValidation.normalized;

    // 3. Find customer by normalized phone (or req.user)
    let customer = null;
    if (req.user) {
      customer = req.user;
    } else {
      customer = await User.findOne({ phone: normalizedPhone, role: 'customer' });
      if (!customer) {
        customer = await User.findOne({ phone: normalizedPhone });
      }
    }
    const customerId = customer ? (customer._id || customer.id) : null;

    // 4. Mutex lock per queue & normalized phone to serialize simultaneous requests
    const lockKey = `${queue._id || queue.id}_${normalizedPhone}`;
    releaseLock = await acquireJoinLock(lockKey);

    // Active statuses: waiting, calling, serving
    // COMPLETED, CANCELLED, SKIPPED are no longer active, allowing the customer to join again!
    const activeStatuses = ['waiting', 'calling', 'serving'];

    const activeEntries = await QueueEntry.find({
      queueId: queue._id || queue.id,
      status: { $in: activeStatuses }
    });

    // Check for duplicate active entry: customer phone number + organization + service + active queue
    const existingActive = activeEntries.find(e => {
      const pCheck = e.customerPhone ? validateAndNormalizePhone(e.customerPhone) : null;
      const phoneMatches = pCheck && pCheck.isValid && pCheck.normalized === normalizedPhone;
      const customerMatches = customerId && e.customerId && String(e.customerId) === String(customerId);
      return phoneMatches || customerMatches;
    });

    if (existingActive) {
      // Calculate duplicate response metrics
      let peopleAhead = 0;
      let position = 1;

      if (existingActive.status === 'waiting') {
        const waitingEntries = activeEntries
          .filter(e => e.status === 'waiting')
          .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        peopleAhead = waitingEntries.filter(e => e.sequenceNumber < existingActive.sequenceNumber).length;
        position = peopleAhead + 1;
      }

      const activeCounters = await Counter.find({
        organizationId: orgId,
        serviceId,
        status: 'open'
      });

      const waitEstimate = await calculateWaitTime({
        customersAhead: peopleAhead,
        averageServiceTime: service.averageServiceTime || 5,
        activeCounters: Math.max(1, activeCounters.length)
      });

      const currentServingToken = queue.currentToken || 'None';
      const formattedWaitTime = existingActive.status === 'waiting'
        ? waitEstimate.formattedWait
        : 'Now Serving';

      return res.status(400).json({
        success: false,
        error: 'ALREADY_IN_QUEUE',
        message: `You are already in this queue with token ${existingActive.tokenNumber}.`,
        existingToken: existingActive.tokenNumber,
        ticket: {
          ...(existingActive.toObject ? existingActive.toObject() : existingActive),
          serviceName: service.name,
          orgName: org ? org.name : '',
          peopleAhead,
          position,
          estimatedWaitTime: waitEstimate.estimatedMinutes,
          formattedWaitTime,
          currentServingToken,
          currentToken: currentServingToken,
          queueStatus: queue.status
        },
        position,
        peopleAhead,
        estimatedWaitTime: waitEstimate.estimatedMinutes,
        formattedWaitTime,
        currentServingToken
      });
    }

    // 5. Generate token
    const tokenInfo = await generateNextToken(queue, service);

    // 6. Create entry with normalized phone
    let entry;
    try {
      entry = await QueueEntry.create({
        queueId: queue._id || queue.id,
        organizationId: orgId,
        serviceId,
        customerId,
        customerName: finalCustomerName,
        customerPhone: normalizedPhone,
        tokenNumber: tokenInfo.tokenNumber,
        sequenceNumber: tokenInfo.sequenceNumber,
        status: 'waiting',
        notes: notes ? notes.trim() : '',
        joinedAt: new Date().toISOString()
      });
    } catch (createErr) {
      // Catch duplicate key error (code 11000) from database-level unique partial index
      if (createErr.code === 11000 || (createErr.message && createErr.message.includes('11000'))) {
        const duplicateEntry = await QueueEntry.findOne({
          queueId: queue._id || queue.id,
          customerPhone: normalizedPhone,
          status: { $in: activeStatuses }
        });
        if (duplicateEntry) {
          const waitingEntries = await QueueEntry.find({
            queueId: queue._id || queue.id,
            status: 'waiting'
          });
          const peopleAhead = waitingEntries.filter(e => e.sequenceNumber < duplicateEntry.sequenceNumber).length;
          return res.status(400).json({
            success: false,
            error: 'ALREADY_IN_QUEUE',
            message: `You are already in this queue with token ${duplicateEntry.tokenNumber}.`,
            existingToken: duplicateEntry.tokenNumber,
            ticket: {
              ...(duplicateEntry.toObject ? duplicateEntry.toObject() : duplicateEntry),
              serviceName: service.name,
              orgName: org ? org.name : '',
              peopleAhead,
              position: peopleAhead + 1,
              currentServingToken: queue.currentToken || 'None',
              currentToken: queue.currentToken || 'None',
              queueStatus: queue.status
            },
            position: peopleAhead + 1,
            peopleAhead,
            currentServingToken: queue.currentToken || 'None'
          });
        }
      }
      throw createErr;
    }

    // Count people ahead
    const waitingEntries = await QueueEntry.find({
      queueId: queue._id || queue.id,
      status: 'waiting'
    });
    const peopleAhead = waitingEntries.filter(e => e.sequenceNumber < entry.sequenceNumber).length;

    // Active counters
    const activeCounters = await Counter.find({
      organizationId: orgId,
      serviceId,
      status: 'open'
    });

    const waitEstimate = await calculateWaitTime({
      customersAhead: peopleAhead,
      averageServiceTime: service.averageServiceTime || 5,
      activeCounters: Math.max(1, activeCounters.length)
    });

    // Send in-app notification & log SMS
    await sendCustomerNotification(io, {
      customerId,
      queueEntryId: entry._id || entry.id,
      title: 'Joined Queue Successfully',
      message: `You joined ${service.name} at ${org ? org.name : 'QVeue'}. Your Token is ${entry.tokenNumber}. Estimated wait: ${waitEstimate.formattedWait}.`,
      type: 'joined',
      metadata: {
        tokenNumber: entry.tokenNumber,
        serviceName: service.name,
        estimatedMinutes: waitEstimate.estimatedMinutes
      },
      customerPhone: normalizedPhone
    });

    // Broadcast queue update to real-time subscribers
    if (io) {
      const allWaiting = waitingEntries.length;
      io.to(`queue:${queue._id || queue.id}`).emit('queue:updated', {
        queueId: queue._id || queue.id,
        serviceId,
        currentToken: queue.currentToken,
        waitingCount: allWaiting,
        status: queue.status
      });
      io.emit('stats:updated');
    }

    const entryObj = entry.toObject ? entry.toObject() : entry;

    res.status(201).json({
      success: true,
      message: 'Successfully joined queue',
      ticket: {
        ...entryObj,
        serviceName: service.name,
        orgName: org ? org.name : '',
        peopleAhead,
        estimatedWaitTime: waitEstimate.estimatedMinutes,
        formattedWaitTime: waitEstimate.formattedWait,
        currentToken: queue.currentToken,
        queueStatus: queue.status
      }
    });
  } catch (error) {
    next(error);
  } finally {
    if (releaseLock) {
      releaseLock();
    }
  }
}

// GET /api/queues/:queueId/status
async function getQueueStatus(req, res, next) {
  try {
    const queue = await Queue.findById(req.params.queueId);
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    const service = await Service.findById(queue.serviceId);
    const org = await Organization.findById(queue.organizationId);

    const allEntries = await QueueEntry.find({ queueId: queue._id || queue.id });
    const waitingEntries = allEntries.filter(e => e.status === 'waiting')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const servedTodayCount = allEntries.filter(e => e.status === 'completed').length;
    const currentCalling = allEntries.find(e => e.status === 'calling' || e.status === 'serving') || null;

    const activeCounters = await Counter.find({
      organizationId: queue.organizationId,
      status: 'open'
    });

    const waitEstimate = await calculateWaitTime({
      customersAhead: waitingEntries.length,
      averageServiceTime: service ? service.averageServiceTime : 5,
      activeCounters: Math.max(1, activeCounters.length)
    });

    res.json({
      success: true,
      data: {
        queueId: queue._id || queue.id,
        organization: org,
        service: service,
        status: queue.status,
        currentToken: queue.currentToken,
        currentTokenNumber: queue.currentTokenNumber,
        lastIssuedNumber: queue.lastIssuedNumber,
        waitingCount: waitingEntries.length,
        servedTodayCount,
        currentCalling,
        nextWaitingToken: waitingEntries.length > 0 ? waitingEntries[0].tokenNumber : null,
        nextWaitingCustomer: waitingEntries.length > 0 ? waitingEntries[0].customerName : null,
        estimatedWaitTime: waitEstimate.estimatedMinutes,
        formattedWaitTime: waitEstimate.formattedWait,
        activeCountersCount: activeCounters.length,
        waitingList: waitingEntries.slice(0, 10) // Preview top 10
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/queues/active/my-tickets (Active tickets for customer)
async function getCustomerActiveTickets(req, res, next) {
  try {
    const customerId = req.user ? (req.user._id || req.user.id) : req.query.customerId;
    const phone = req.query.phone || (req.user ? req.user.phone : null);
    const phoneValidation = phone ? validateAndNormalizePhone(phone) : null;
    const normalizedPhone = phoneValidation && phoneValidation.isValid ? phoneValidation.normalized : null;

    if (!customerId && !normalizedPhone) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const allActive = await QueueEntry.find({
      status: { $in: ['waiting', 'calling', 'serving'] }
    });

    const activeEntries = allActive.filter((entry) => {
      const cMatch = customerId && entry.customerId && String(entry.customerId) === String(customerId);
      const pCheck = entry.customerPhone ? validateAndNormalizePhone(entry.customerPhone) : null;
      const pMatch = normalizedPhone && pCheck && pCheck.isValid && pCheck.normalized === normalizedPhone;
      return cMatch || pMatch;
    });

    const enriched = await Promise.all(
      activeEntries.map(async (entry) => {
        const queue = await Queue.findById(entry.queueId);
        const service = await Service.findById(entry.serviceId);
        const org = await Organization.findById(entry.organizationId);

        let peopleAhead = 0;
        let estimatedWait = 0;

        if (queue && entry.status === 'waiting') {
          const allWaiting = await QueueEntry.find({
            queueId: queue._id || queue.id,
            status: 'waiting'
          });
          peopleAhead = allWaiting.filter(e => e.sequenceNumber < entry.sequenceNumber).length;

          const openCounters = await Counter.find({
            organizationId: entry.organizationId,
            serviceId: entry.serviceId,
            status: 'open'
          });

          const estimate = await calculateWaitTime({
            customersAhead: peopleAhead,
            averageServiceTime: service ? service.averageServiceTime : 5,
            activeCounters: Math.max(1, openCounters.length)
          });
          estimatedWait = estimate.estimatedMinutes;
        }

        return {
          ...entry,
          serviceName: service ? service.name : 'Service',
          averageServiceTime: service ? service.averageServiceTime : 5,
          orgName: org ? org.name : 'Organization',
          orgType: org ? org.type : 'general',
          peopleAhead,
          estimatedWaitMinutes: estimatedWait,
          formattedWait: estimatedWait === 1 ? '1 min' : `${estimatedWait} min`,
          currentToken: queue ? queue.currentToken : null,
          queueStatus: queue ? queue.status : 'active'
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
}

// GET /api/queues/history/my-tickets
async function getCustomerHistory(req, res, next) {
  try {
    const customerId = req.user ? (req.user._id || req.user.id) : req.query.customerId;
    const phone = req.query.phone || (req.user ? req.user.phone : null);
    const phoneValidation = phone ? validateAndNormalizePhone(phone) : null;
    const normalizedPhone = phoneValidation && phoneValidation.isValid ? phoneValidation.normalized : null;

    if (!customerId && !normalizedPhone) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const allHistory = await QueueEntry.find({
      status: { $in: ['completed', 'skipped', 'cancelled'] }
    });

    const history = allHistory.filter((entry) => {
      const cMatch = customerId && entry.customerId && String(entry.customerId) === String(customerId);
      const pCheck = entry.customerPhone ? validateAndNormalizePhone(entry.customerPhone) : null;
      const pMatch = normalizedPhone && pCheck && pCheck.isValid && pCheck.normalized === normalizedPhone;
      return cMatch || pMatch;
    });

    const enriched = await Promise.all(
      history.map(async (entry) => {
        const service = await Service.findById(entry.serviceId);
        const org = await Organization.findById(entry.organizationId);
        return {
          ...entry,
          serviceName: service ? service.name : 'Service',
          orgName: org ? org.name : 'Organization'
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      data: enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/:queueId/next (Staff calls next customer)
async function callNext(req, res, next) {
  try {
    const { queueId } = req.params;
    const { counterNumber, counterId } = req.body;
    const io = req.app.get('io');
    const staffUser = req.user;

    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    if (queue.status === 'paused') {
      return res.status(400).json({ success: false, message: 'Queue is currently paused. Please resume first.' });
    }

    // Find all waiting tickets ordered by sequenceNumber
    const waitingTickets = await QueueEntry.find({
      queueId: queue._id || queue.id,
      status: 'waiting'
    });

    waitingTickets.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    if (waitingTickets.length === 0) {
      return res.status(400).json({ success: false, message: 'No more customers waiting in this queue.' });
    }

    const nextTicket = waitingTickets[0];
    const service = await Service.findById(queue.serviceId);
    const org = await Organization.findById(queue.organizationId);

    // Determine counter info
    let finalCounterNumber = counterNumber;
    let finalCounterId = counterId;

    if (!finalCounterNumber && staffUser && staffUser.counterId) {
      const userCounter = await Counter.findById(staffUser.counterId);
      if (userCounter) {
        finalCounterNumber = userCounter.counterNumber;
        finalCounterId = userCounter._id || userCounter.id;
      }
    }
    if (!finalCounterNumber) {
      finalCounterNumber = 'Counter 1';
    }

    // If staff was previously calling/serving another customer, complete or transition it
    const activeStaffEntry = await QueueEntry.findOne({
      queueId: queue._id || queue.id,
      servedBy: staffUser ? (staffUser._id || staffUser.id) : null,
      status: { $in: ['calling', 'serving'] }
    });

    if (activeStaffEntry && String(activeStaffEntry._id) !== String(nextTicket._id)) {
      await QueueEntry.findByIdAndUpdate(activeStaffEntry._id || activeStaffEntry.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    }

    // Update the next ticket to calling
    const updatedTicket = await QueueEntry.findByIdAndUpdate(
      nextTicket._id || nextTicket.id,
      {
        status: 'calling',
        counterId: finalCounterId,
        counterNumber: finalCounterNumber,
        servedBy: staffUser ? (staffUser._id || staffUser.id) : null,
        calledAt: new Date().toISOString()
      },
      { new: true }
    );

    // Update queue state
    await Queue.findByIdAndUpdate(queue._id || queue.id, {
      currentToken: nextTicket.tokenNumber,
      currentTokenNumber: nextTicket.sequenceNumber,
      currentEntryId: nextTicket._id || nextTicket.id
    });

    // 1. Notify the CALLED customer immediately!
    await sendCustomerNotification(io, {
      customerId: nextTicket.customerId,
      queueEntryId: nextTicket._id || nextTicket.id,
      title: 'Now Serving You!',
      message: `Now Serving ${nextTicket.tokenNumber} – Please proceed to ${finalCounterNumber}.`,
      type: 'called',
      metadata: {
        tokenNumber: nextTicket.tokenNumber,
        counterNumber: finalCounterNumber,
        serviceName: service ? service.name : '',
        orgName: org ? org.name : ''
      },
      customerPhone: nextTicket.customerPhone
    });

    // 2. Proactive Alert: Notify customers whose turn is approaching (e.g., remaining waiting people ahead <= 2)
    const remainingWaiting = waitingTickets.slice(1);
    for (let i = 0; i < Math.min(2, remainingWaiting.length); i++) {
      const approachingTicket = remainingWaiting[i];
      const peopleAhead = i + 1; // 1 or 2 ahead
      const waitEst = await calculateWaitTime({
        customersAhead: peopleAhead,
        averageServiceTime: service ? service.averageServiceTime : 5
      });

      await sendCustomerNotification(io, {
        customerId: approachingTicket.customerId,
        queueEntryId: approachingTicket._id || approachingTicket.id,
        title: 'Your Turn Is Approaching!',
        message: `Your turn is approaching! Token ${approachingTicket.tokenNumber} has only ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead (~${waitEst.formattedWait}). Please be near the waiting counter.`,
        type: 'turn_approaching',
        metadata: {
          tokenNumber: approachingTicket.tokenNumber,
          peopleAhead,
          estimatedMinutes: waitEst.estimatedMinutes
        },
        customerPhone: approachingTicket.customerPhone
      });
    }

    // 3. Broadcast real-time Socket.IO events to all queue listeners and display boards
    if (io) {
      io.to(`queue:${queue._id || queue.id}`).emit('queue:updated', {
        queueId: queue._id || queue.id,
        currentToken: nextTicket.tokenNumber,
        currentTokenNumber: nextTicket.sequenceNumber,
        counterNumber: finalCounterNumber,
        waitingCount: remainingWaiting.length,
        status: queue.status,
        timestamp: new Date().toISOString()
      });

      io.emit('ticket:called', {
        tokenNumber: nextTicket.tokenNumber,
        counterNumber: finalCounterNumber,
        serviceName: service ? service.name : 'Service',
        orgName: org ? org.name : '',
        timestamp: new Date().toISOString()
      });

      io.emit('stats:updated');
    }

    res.json({
      success: true,
      message: `Called next customer: ${nextTicket.tokenNumber}`,
      data: {
        calledTicket: updatedTicket,
        currentToken: nextTicket.tokenNumber,
        counterNumber: finalCounterNumber,
        remainingWaiting: remainingWaiting.length
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/:queueId/recall (Re-announce current token)
async function recallCustomer(req, res, next) {
  try {
    const { queueId } = req.params;
    const { counterNumber } = req.body;
    const io = req.app.get('io');

    const queue = await Queue.findById(queueId);
    if (!queue || !queue.currentToken) {
      return res.status(400).json({ success: false, message: 'No current token being served to recall.' });
    }

    const currentEntry = await QueueEntry.findOne({
      queueId: queue._id || queue.id,
      tokenNumber: queue.currentToken,
      status: { $in: ['calling', 'serving'] }
    });

    const service = await Service.findById(queue.serviceId);
    const org = await Organization.findById(queue.organizationId);
    const counter = counterNumber || (currentEntry ? currentEntry.counterNumber : 'Counter 1');

    if (currentEntry) {
      await sendCustomerNotification(io, {
        customerId: currentEntry.customerId,
        queueEntryId: currentEntry._id || currentEntry.id,
        title: 'Recall Notice: Now Serving You!',
        message: `Recall: Token ${queue.currentToken} – Please proceed immediately to ${counter}.`,
        type: 'called',
        metadata: {
          tokenNumber: queue.currentToken,
          counterNumber: counter
        },
        customerPhone: currentEntry.customerPhone
      });
    }

    if (io) {
      io.emit('ticket:called', {
        tokenNumber: queue.currentToken,
        counterNumber: counter,
        serviceName: service ? service.name : 'Service',
        orgName: org ? org.name : '',
        isRecall: true,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Recalled ${queue.currentToken} at ${counter}`
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/:queueId/skip (Skip current customer)
async function skipCustomer(req, res, next) {
  try {
    const { queueId } = req.params;
    const io = req.app.get('io');

    const queue = await Queue.findById(queueId);
    if (!queue || !queue.currentToken) {
      return res.status(400).json({ success: false, message: 'No active token to skip.' });
    }

    const skippedToken = queue.currentToken;
    const entry = await QueueEntry.findOne({
      queueId: queue._id || queue.id,
      tokenNumber: skippedToken,
      status: { $in: ['calling', 'serving', 'waiting'] }
    });

    if (entry) {
      await QueueEntry.findByIdAndUpdate(entry._id || entry.id, {
        status: 'skipped',
        completedAt: new Date().toISOString()
      });

      await sendCustomerNotification(io, {
        customerId: entry.customerId,
        queueEntryId: entry._id || entry.id,
        title: 'Token Skipped',
        message: `Your token ${skippedToken} was skipped because you were not present at the counter. Please visit the help desk to rejoin.`,
        type: 'skipped',
        customerPhone: entry.customerPhone
      });
    }

    // Reset current token
    await Queue.findByIdAndUpdate(queue._id || queue.id, {
      currentToken: null,
      currentEntryId: null
    });

    const waitingRemaining = await QueueEntry.countDocuments({
      queueId: queue._id || queue.id,
      status: 'waiting'
    });

    if (io) {
      io.to(`queue:${queue._id || queue.id}`).emit('queue:updated', {
        queueId: queue._id || queue.id,
        currentToken: null,
        waitingCount: waitingRemaining,
        status: queue.status
      });
      io.emit('stats:updated');
    }

    res.json({
      success: true,
      message: `Token ${skippedToken} has been skipped.`,
      skippedToken
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/:queueId/complete (Complete current customer)
async function completeService(req, res, next) {
  try {
    const { queueId } = req.params;
    const io = req.app.get('io');

    const queue = await Queue.findById(queueId);
    if (!queue || !queue.currentToken) {
      return res.status(400).json({ success: false, message: 'No active token to complete.' });
    }

    const completedToken = queue.currentToken;
    const entry = await QueueEntry.findOne({
      queueId: queue._id || queue.id,
      tokenNumber: completedToken,
      status: { $in: ['calling', 'serving'] }
    });

    if (entry) {
      await QueueEntry.findByIdAndUpdate(entry._id || entry.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      await sendCustomerNotification(io, {
        customerId: entry.customerId,
        queueEntryId: entry._id || entry.id,
        title: 'Service Completed',
        message: `Thank you! Your service for token ${completedToken} is completed.`,
        type: 'completed',
        customerPhone: entry.customerPhone
      });
    }

    // Clear current token
    await Queue.findByIdAndUpdate(queue._id || queue.id, {
      currentToken: null,
      currentEntryId: null
    });

    const waitingRemaining = await QueueEntry.countDocuments({
      queueId: queue._id || queue.id,
      status: 'waiting'
    });

    if (io) {
      io.to(`queue:${queue._id || queue.id}`).emit('queue:updated', {
        queueId: queue._id || queue.id,
        currentToken: null,
        waitingCount: waitingRemaining,
        status: queue.status
      });
      io.emit('stats:updated');
    }

    res.json({
      success: true,
      message: `Service for token ${completedToken} marked as completed.`,
      completedToken
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/:queueId/pause
async function pauseQueue(req, res, next) {
  try {
    const { queueId } = req.params;
    const io = req.app.get('io');

    const updated = await Queue.findByIdAndUpdate(queueId, { status: 'paused' }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    if (io) {
      io.to(`queue:${queueId}`).emit('queue:status_changed', {
        queueId,
        status: 'paused'
      });
    }

    res.json({ success: true, message: 'Queue paused.', queue: updated });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/:queueId/resume
async function resumeQueue(req, res, next) {
  try {
    const { queueId } = req.params;
    const io = req.app.get('io');

    const updated = await Queue.findByIdAndUpdate(queueId, { status: 'active' }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Queue not found.' });
    }

    if (io) {
      io.to(`queue:${queueId}`).emit('queue:status_changed', {
        queueId,
        status: 'active'
      });
    }

    res.json({ success: true, message: 'Queue resumed.', queue: updated });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/entry/:entryId/cancel (Customer leaves/cancels queue)
async function cancelTicket(req, res, next) {
  try {
    const { entryId } = req.params;
    const io = req.app.get('io');

    const entry = await QueueEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (entry.status !== 'waiting') {
      return res.status(400).json({ success: false, message: `Cannot cancel ticket with status '${entry.status}'.` });
    }

    await QueueEntry.findByIdAndUpdate(entryId, {
      status: 'cancelled',
      completedAt: new Date().toISOString()
    });

    const waitingRemaining = await QueueEntry.countDocuments({
      queueId: entry.queueId,
      status: 'waiting'
    });

    if (io) {
      io.to(`queue:${entry.queueId}`).emit('queue:updated', {
        queueId: entry.queueId,
        waitingCount: waitingRemaining
      });
      io.emit('stats:updated');
    }

    res.json({ success: true, message: 'Ticket cancelled successfully.' });
  } catch (error) {
    next(error);
  }
}

// POST /api/queues/entry/:entryId/complete (Mark ticket as completed)
async function completeTicketById(req, res, next) {
  try {
    const { entryId } = req.params;
    const io = req.app.get('io');

    const entry = await QueueEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const updated = await QueueEntry.findByIdAndUpdate(entryId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    const waitingRemaining = await QueueEntry.countDocuments({
      queueId: entry.queueId,
      status: 'waiting'
    });

    if (io) {
      io.to(`queue:${entry.queueId}`).emit('queue:updated', {
        queueId: entry.queueId,
        waitingCount: waitingRemaining
      });
      io.emit('stats:updated');
    }

    res.json({ success: true, message: 'Ticket completed successfully.', entry: updated });
  } catch (error) {
    next(error);
  }
}

// GET /api/queues/staff/my-queue
async function getStaffQueue(req, res, next) {
  try {
    const staff = req.user;
    if (!staff) {
      return res.status(401).json({ success: false, message: 'Staff authentication required.' });
    }

    let service = null;
    let counter = null;
    let organization = null;

    if (staff.counterId) {
      counter = await Counter.findById(staff.counterId);
      if (counter && counter.serviceId) {
        service = await Service.findById(counter.serviceId);
      }
    }

    if (!service && staff.organizationId) {
      // Find the first active service for this org as default
      const services = await Service.find({ organizationId: staff.organizationId, status: 'active' });
      if (services.length > 0) service = services[0];
    }

    if (staff.organizationId) {
      organization = await Organization.findById(staff.organizationId);
    }

    if (!service) {
      // Fallback to first available service in database
      const allServices = await Service.find({ status: 'active' });
      if (allServices.length > 0) service = allServices[0];
    }

    if (!service) {
      return res.status(404).json({ success: false, message: 'No services assigned to this staff member.' });
    }

    const queue = await getOrCreateTodayQueue(service._id || service.id, service.organizationId);
    const allEntries = await QueueEntry.find({ queueId: queue._id || queue.id });

    const waitingList = allEntries
      .filter(e => e.status === 'waiting')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const servedToday = allEntries.filter(e => e.status === 'completed');
    const currentlyCalling = allEntries.find(e => e.status === 'calling' || e.status === 'serving');

    const waitEstimate = await calculateWaitTime({
      customersAhead: waitingList.length,
      averageServiceTime: service.averageServiceTime || 5
    });

    res.json({
      success: true,
      data: {
        queueId: queue._id || queue.id,
        queueStatus: queue.status,
        currentToken: queue.currentToken,
        currentlyCalling,
        service,
        organization,
        counter: counter || { counterNumber: 'Counter 1' },
        waitingCount: waitingList.length,
        servedTodayCount: servedToday.length,
        estimatedWaitTime: waitEstimate.estimatedMinutes,
        formattedWaitTime: waitEstimate.formattedWait,
        waitingList
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/queues/preview/:orgId/:serviceId (Quick preview for specific service QR code landing)
async function getQueuePreviewByService(req, res, next) {
  try {
    const { orgId, serviceId } = req.params;
    const org = await Organization.findById(orgId);
    const service = await Service.findById(serviceId);

    if (!org || org.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Organization not found or is currently inactive.' });
    }

    if (!service || service.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Service not found or is currently inactive.' });
    }

    const effectiveOrgId = orgId || service.organizationId;
    const queue = await getOrCreateTodayQueue(serviceId, effectiveOrgId);
    const allWaiting = await QueueEntry.find({
      queueId: queue._id || queue.id,
      status: 'waiting'
    });

    const activeCounters = await Counter.find({
      organizationId: effectiveOrgId,
      serviceId,
      status: 'open'
    });

    const waitEstimate = await calculateWaitTime({
      customersAhead: allWaiting.length,
      averageServiceTime: service.averageServiceTime || 5,
      activeCounters: Math.max(1, activeCounters.length)
    });

    res.json({
      success: true,
      data: {
        organization: org,
        service,
        queueId: queue._id || queue.id,
        status: queue.status,
        currentToken: queue.currentToken,
        waitingCount: allWaiting.length,
        estimatedWaitMinutes: waitEstimate.estimatedMinutes,
        formattedWait: waitEstimate.formattedWait,
        activeCountersCount: activeCounters.length
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/queues/preview/:orgId (Preview all services for an organization entrance QR)
async function getQueuePreviewByOrg(req, res, next) {
  try {
    const { orgId } = req.params;
    const org = await Organization.findById(orgId);
    if (!org || org.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Organization not found or is currently inactive.' });
    }

    const services = await Service.find({ organizationId: orgId, status: 'active' });
    const enrichedServices = await Promise.all(
      services.map(async (srv) => {
        const queue = await getOrCreateTodayQueue(srv._id || srv.id, orgId);
        const waitingEntries = await QueueEntry.find({
          queueId: queue._id || queue.id,
          status: 'waiting'
        });
        const activeCounters = await Counter.find({
          organizationId: orgId,
          serviceId: srv._id || srv.id,
          status: 'open'
        });
        const waitEstimate = await calculateWaitTime({
          customersAhead: waitingEntries.length,
          averageServiceTime: srv.averageServiceTime || 5,
          activeCounters: Math.max(1, activeCounters.length)
        });

        return {
          ...srv,
          queueId: queue._id || queue.id,
          queueStatus: queue.status,
          currentToken: queue.currentToken,
          waitingCount: waitingEntries.length,
          estimatedWaitMinutes: waitEstimate.estimatedMinutes,
          formattedWait: waitEstimate.formattedWait,
          activeCountersCount: activeCounters.length
        };
      })
    );

    res.json({
      success: true,
      data: {
        organization: org,
        services: enrichedServices
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  joinQueue,
  getQueueStatus,
  getCustomerActiveTickets,
  getCustomerHistory,
  callNext,
  recallCustomer,
  skipCustomer,
  completeService,
  pauseQueue,
  resumeQueue,
  cancelTicket,
  completeTicketById,
  getStaffQueue,
  getQueuePreviewByService,
  getQueuePreviewByOrg
};

