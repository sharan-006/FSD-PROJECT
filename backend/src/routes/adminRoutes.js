const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllUsers,
  getAllQueuesMonitor,
  getNetworkInfo
} = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/analytics', protect, requireRole('admin'), getAnalytics);
router.get('/users', protect, requireRole('admin'), getAllUsers);
router.get('/queues-monitor', protect, requireRole('admin'), getAllQueuesMonitor);
router.get('/network-info', getNetworkInfo);

module.exports = router;
