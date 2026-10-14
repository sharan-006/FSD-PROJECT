const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['hospital', 'bank', 'service_center', 'government', 'retail', 'other'], 
    default: 'service_center' 
  },
  address: { type: String, default: '' },
  contact: { type: String, default: '' },
  tagline: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
