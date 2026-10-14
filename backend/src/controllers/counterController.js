const Counter = require('../models/Counter');
const User = require('../models/User');

// GET /api/counters/org/:orgId
async function getCountersByOrg(req, res, next) {
  try {
    const counters = await Counter.find({ organizationId: req.params.orgId });
    // Attach staff info if available
    const populated = await Promise.all(
      counters.map(async (c) => {
        let staff = null;
        if (c.staffId) {
          staff = await User.findById(c.staffId);
          if (staff) {
            staff = { id: staff._id || staff.id, name: staff.name, email: staff.email };
          }
        }
        const cObj = c.toObject ? c.toObject() : c;
        return {
          ...cObj,
          staff
        };
      })
    );
    res.json({ success: true, count: populated.length, data: populated });
  } catch (error) {
    next(error);
  }
}

// POST /api/counters (Admin only)
async function createCounter(req, res, next) {
  try {
    const { organizationId, serviceId, counterNumber, staffId, status } = req.body;
    if (!organizationId || !counterNumber) {
      return res.status(400).json({ success: false, message: 'Organization ID and counter number are required.' });
    }

    const counter = await Counter.create({
      organizationId,
      serviceId: serviceId || null,
      counterNumber,
      staffId: staffId || null,
      status: status || 'open'
    });

    res.status(201).json({ success: true, message: 'Counter created', data: counter });
  } catch (error) {
    next(error);
  }
}

// PUT /api/counters/:id/status (Staff / Admin)
async function updateCounterStatus(req, res, next) {
  try {
    const { status, staffId } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (staffId !== undefined) updateData.staffId = staffId;

    const updated = await Counter.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    // Broadcast counter update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`org:${updated.organizationId}`).emit('counter:updated', updated);
    }

    res.json({ success: true, message: 'Counter status updated', data: updated });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/counters/:id (Admin only)
async function deleteCounter(req, res, next) {
  try {
    await Counter.findByIdAndUpdate(req.params.id, { status: 'closed' });
    res.json({ success: true, message: 'Counter closed' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCountersByOrg,
  createCounter,
  updateCounterStatus,
  deleteCounter
};
