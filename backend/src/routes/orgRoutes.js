const express = require('express');
const router = express.Router();
const {
  getOrganizations,
  getOrgById,
  createOrganization,
  updateOrganization,
  deleteOrganization
} = require('../controllers/orgController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', getOrganizations);
router.get('/:id', getOrgById);
router.post('/', protect, requireRole('admin'), createOrganization);
router.put('/:id', protect, requireRole('admin'), updateOrganization);
router.delete('/:id', protect, requireRole('admin'), deleteOrganization);

module.exports = router;
