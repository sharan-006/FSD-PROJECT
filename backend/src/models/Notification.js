const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  customerId: { type: String, ref: 'User', required: true },
  queueEntryId: { type: String, ref: 'QueueEntry', default: null },
  title: { type: String, default: 'Queue Update' },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['joined', 'turn_approaching', 'called', 'skipped', 'completed', 'queue_paused', 'queue_resumed'],
    default: 'joined'
  },
  read: { type: Boolean, default: false },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
