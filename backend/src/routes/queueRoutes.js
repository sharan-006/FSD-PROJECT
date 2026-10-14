const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/queueController');
const { protect, optionalAuth, requireRole } = require('../middleware/auth');

// Customer / Public endpoints
router.post('/join', optionalAuth, joinQueue);
router.get('/preview/:orgId', getQueuePreviewByOrg);
router.get('/preview/:orgId/:serviceId', getQueuePreviewByService);
router.get('/active/my-tickets', optionalAuth, getCustomerActiveTickets);
router.get('/history/my-tickets', optionalAuth, getCustomerHistory);
router.post('/entry/:entryId/cancel', optionalAuth, cancelTicket);
router.post('/entry/:entryId/complete', optionalAuth, completeTicketById);
router.get('/:queueId/status', getQueueStatus);

// Staff endpoints
router.get('/staff/my-queue', protect, requireRole('staff', 'admin'), getStaffQueue);
router.post('/:queueId/next', protect, requireRole('staff', 'admin'), callNext);
router.post('/:queueId/recall', protect, requireRole('staff', 'admin'), recallCustomer);
router.post('/:queueId/skip', protect, requireRole('staff', 'admin'), skipCustomer);
router.post('/:queueId/complete', protect, requireRole('staff', 'admin'), completeService);
router.post('/:queueId/pause', protect, requireRole('staff', 'admin'), pauseQueue);
router.post('/:queueId/resume', protect, requireRole('staff', 'admin'), resumeQueue);

module.exports = router;
