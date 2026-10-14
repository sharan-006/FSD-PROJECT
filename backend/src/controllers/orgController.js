const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Counter = require('../models/Counter');

// GET /api/organizations
async function getOrganizations(req, res, next) {
  try {
    const orgs = await Organization.find({ status: 'active' });
    res.json({ success: true, count: orgs.length, data: orgs });
  } catch (error) {
    next(error);
  }
}

// GET /api/organizations/:id
async function getOrgById(req, res, next) {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const services = await Service.find({ organizationId: org._id || org.id, status: 'active' });
    const counters = await Counter.find({ organizationId: org._id || org.id });

    const orgObj = org.toObject ? org.toObject() : org;
    res.json({
      success: true,
      data: {
        ...orgObj,
        services,
        counters
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/organizations (Admin only)
async function createOrganization(req, res, next) {
  try {
    const { name, type, address, contact, tagline } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Organization name is required.' });
    }

    const org = await Organization.create({
      name,
      type: type || 'service_center',
      address: address || '',
      contact: contact || '',
      tagline: tagline || '',
      status: 'active'
    });

    res.status(201).json({ success: true, message: 'Organization created', data: org });
  } catch (error) {
    next(error);
  }
}

// PUT /api/organizations/:id (Admin only)
async function updateOrganization(req, res, next) {
  try {
    const updated = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    res.json({ success: true, message: 'Organization updated', data: updated });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/organizations/:id (Admin only)
async function deleteOrganization(req, res, next) {
  try {
    await Organization.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    res.json({ success: true, message: 'Organization deactivated' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrganizations,
  getOrgById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
