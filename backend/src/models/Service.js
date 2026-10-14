const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  organizationId: { type: String, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  averageServiceTime: { type: Number, required: true, default: 5 }, // in minutes
  prefix: { type: String, default: 'Q', uppercase: true, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  icon: { type: String, default: 'clipboard' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.models.Service || mongoose.model('Service', ServiceSchema);
