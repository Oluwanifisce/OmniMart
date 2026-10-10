const express = require('express');
const { body } = require('express-validator');
const {
  getVendorProfile,
  updateVendorProfile,
  createProduct,
  getVendorProducts,
  getVendorProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/vendor.controller');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { requireApprovedVendor } = require('../middleware/vendorCheck');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Enforce vendor role authorization for all vendor endpoints
router.use(authenticateToken, authorizeRoles('vendor'));

/**
 * @route GET /api/vendor/profile
 */
router.get('/profile', getVendorProfile);

/**
 * @route PUT /api/vendor/profile
 */
router.put('/profile', updateVendorProfile);

/**
 * @route GET /api/vendor/products
 */
router.get('/products', getVendorProducts);

/**
 * @route GET /api/vendor/products/:id
 */
router.get('/products/:id', getVendorProductById);

/**
 * @route POST /api/vendor/products
 * Protected: Requires APPROVED vendor verification status
 */
router.post(
  '/products',
  requireApprovedVendor,
  [
    body('title').notEmpty().withMessage('Product title is required'),
    body('description').notEmpty().withMessage('Product description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a number greater than or equal to 0'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    validate,
  ],
  createProduct
);

/**
 * @route PUT /api/vendor/products/:id
 * Protected: Requires APPROVED vendor verification status
 */
router.put(
  '/products/:id',
  requireApprovedVendor,
  [
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    validate,
  ],
  updateProduct
);

/**
 * @route DELETE /api/vendor/products/:id
 * Protected: Requires APPROVED vendor verification status
 */
router.delete('/products/:id', requireApprovedVendor, deleteProduct);

module.exports = router;
