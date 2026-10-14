const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { optionalAuth } = require('../middleware/auth');

router.get('/my', optionalAuth, getMyNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', optionalAuth, markAllAsRead);

module.exports = router;
