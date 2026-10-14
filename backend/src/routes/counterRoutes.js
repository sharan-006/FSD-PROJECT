const express = require('express');
const router = express.Router();
const {
  getCountersByOrg,
  createCounter,
  updateCounterStatus,
  deleteCounter
} = require('../controllers/counterController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/org/:orgId', getCountersByOrg);
router.post('/', protect, requireRole('admin'), createCounter);
router.put('/:id/status', protect, requireRole('admin', 'staff'), updateCounterStatus);
router.delete('/:id', protect, requireRole('admin'), deleteCounter);

module.exports = router;
