const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  organizationId: { type: String, ref: 'Organization', required: true },
  serviceId: { type: String, ref: 'Service', required: true },
  counterNumber: { type: String, required: true }, // e.g. "Counter 1"
  staffId: { type: String, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'closed', 'busy'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
