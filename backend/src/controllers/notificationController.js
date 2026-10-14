const Notification = require('../models/Notification');

// GET /api/notifications/my
async function getMyNotifications(req, res, next) {
  try {
    const customerId = req.user ? (req.user._id || req.user.id) : req.query.customerId;
    if (!customerId) {
      return res.json({ success: true, count: 0, unreadCount: 0, data: [] });
    }

    const notifications = await Notification.find({ customerId: String(customerId) });
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/notifications/:id/read
async function markAsRead(req, res, next) {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

// PUT /api/notifications/read-all
async function markAllAsRead(req, res, next) {
  try {
    const customerId = req.user ? (req.user._id || req.user.id) : req.body.customerId;
    if (customerId) {
      await Notification.updateMany({ customerId: String(customerId) }, { read: true });
    }
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
