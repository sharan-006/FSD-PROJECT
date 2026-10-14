const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  organizationId: { type: String, ref: 'Organization', required: true },
  serviceId: { type: String, ref: 'Service', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active' },
  currentToken: { type: String, default: null }, // e.g. "Q-018"
  currentEntryId: { type: String, ref: 'QueueEntry', default: null },
  currentTokenNumber: { type: Number, default: 0 },
  lastIssuedNumber: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.models.Queue || mongoose.model('Queue', QueueSchema);
