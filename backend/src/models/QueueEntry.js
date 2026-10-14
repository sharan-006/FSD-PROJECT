const mongoose = require('mongoose');

const QueueEntrySchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  queueId: { type: String, ref: 'Queue', required: true },
  organizationId: { type: String, ref: 'Organization', required: true },
  serviceId: { type: String, ref: 'Service', required: true },
  customerId: { type: String, ref: 'User', default: null },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, default: '', trim: true },
  tokenNumber: { type: String, required: true }, // e.g. "Q-024"
  sequenceNumber: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'calling', 'serving', 'completed', 'skipped', 'cancelled'], 
    default: 'waiting' 
  },
  counterId: { type: String, ref: 'Counter', default: null },
  counterNumber: { type: String, default: '' },
  servedBy: { type: String, ref: 'User', default: null },
  joinedAt: { type: Date, default: Date.now },
  calledAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Database-level protection: Prevent duplicate active queue entries for same customer phone & queue
QueueEntrySchema.index(
  { queueId: 1, serviceId: 1, customerPhone: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: ['waiting', 'calling', 'serving'] },
      customerPhone: { $type: 'string', $gt: '' }
    } 
  }
);

module.exports = mongoose.models.QueueEntry || mongoose.model('QueueEntry', QueueEntrySchema);
