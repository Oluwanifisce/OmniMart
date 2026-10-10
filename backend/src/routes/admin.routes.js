const express = require('express');
const { body } = require('express-validator');
const {
  getAllVendors,
  getVendorById,
  updateVendorStatus,
  getGlobalAnalytics,
} = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Enforce admin-only access across all admin routes
router.use(authenticateToken, authorizeRoles('admin'));

/**
 * @route GET /api/admin/analytics
 */
router.get('/analytics', getGlobalAnalytics);

/**
 * @route GET /api/admin/vendors
 */
router.get('/vendors', getAllVendors);

/**
 * @route GET /api/admin/vendors/:id
 */
router.get('/vendors/:id', getVendorById);

/**
 * @route PATCH /api/admin/vendors/:id/status
 */
router.patch(
  '/vendors/:id/status',
  [
    body('verificationStatus')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'suspended'])
      .withMessage('Invalid status value'),
    body('commissionRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Commission rate must be between 0 and 100'),
    validate,
  ],
  updateVendorStatus
);

module.exports = router;
