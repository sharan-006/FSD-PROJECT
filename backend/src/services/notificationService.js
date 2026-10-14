/**
 * QVeue Notification Dispatcher & Architecture
 * 
 * Manages in-app notifications, Socket.IO live alerts, and provides
 * extensible adapters for SMS, WhatsApp, and Email integrations.
 */

const Notification = require('../models/Notification');

// Mock third-party notification adapters for SMS / WhatsApp / Push
const externalAdapters = {
  sms: async (phone, message) => {
    if (!phone) return;
    console.log(`[SMS Gateway Simulated] -> ${phone}: "${message}"`);
  },
  whatsapp: async (phone, message) => {
    if (!phone) return;
    console.log(`[WhatsApp Gateway Simulated] -> ${phone}: "${message}"`);
  },
  email: async (email, subject, message) => {
    if (!email) return;
    console.log(`[Email Service Simulated] -> ${email}: [${subject}] "${message}"`);
  }
};

/**
 * Creates and dispatches a notification to a customer
 */
async function sendCustomerNotification(io, {
  customerId,
  queueEntryId = null,
  title = 'Queue Update',
  message,
  type = 'joined',
  metadata = {},
  customerPhone = null,
  customerEmail = null
}) {
  if (!customerId && !customerPhone) return null;

  let savedNotification = null;
  if (customerId) {
    savedNotification = await Notification.create({
      customerId,
      queueEntryId,
      title,
      message,
      type,
      metadata,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  // Real-time Socket.IO emission
  if (io && customerId) {
    io.to(`user:${customerId}`).emit('notification:new', {
      notification: savedNotification,
      title,
      message,
      type,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Dispatch to external channel adapters asynchronously
  if (customerPhone) {
    externalAdapters.sms(customerPhone, `${title}: ${message}`).catch(() => {});
  }
  if (customerEmail) {
    externalAdapters.email(customerEmail, `QVeue - ${title}`, message).catch(() => {});
  }

  return savedNotification;
}

module.exports = {
  sendCustomerNotification,
  externalAdapters
};
