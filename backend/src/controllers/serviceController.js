const Service = require('../models/Service');
const Queue = require('../models/Queue');

// GET /api/services/org/:orgId
async function getServicesByOrg(req, res, next) {
  try {
    const services = await Service.find({ organizationId: req.params.orgId, status: 'active' });
    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
}

// GET /api/services/:id
async function getServiceById(req, res, next) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
}

// POST /api/services (Admin only)
async function createService(req, res, next) {
  try {
    const { organizationId, name, description, averageServiceTime, prefix, icon } = req.body;
    if (!organizationId || !name) {
      return res.status(400).json({ success: false, message: 'Organization ID and Service Name are required.' });
    }

    const service = await Service.create({
      organizationId,
      name,
      description: description || '',
      averageServiceTime: Number(averageServiceTime) || 5,
      prefix: (prefix || name[0] || 'Q').toUpperCase(),
      icon: icon || 'clipboard',
      status: 'active'
    });

    res.status(201).json({ success: true, message: 'Service created', data: service });
  } catch (error) {
    next(error);
  }
}

// PUT /api/services/:id (Admin only)
async function updateService(req, res, next) {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service updated', data: updated });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/services/:id (Admin only)
async function deleteService(req, res, next) {
  try {
    await Service.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    res.json({ success: true, message: 'Service deactivated' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getServicesByOrg,
  getServiceById,
  createService,
  updateService,
  deleteService
};
