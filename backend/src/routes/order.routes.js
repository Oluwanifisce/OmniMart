const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  updateVendorItemStatus,
  getAdminOrders,
} = require('../controllers/order.controller');
const { verifyUser } = require('../controllers/auth.controller');
const { authorizeRoles } = require('../middleware/rbac');
const { requireApprovedVendor } = require('../middleware/vendorCheck');

const router = express.Router();

// Customer Order Routes
router.post('/', verifyUser, createOrder);
router.get('/my-orders', verifyUser, getMyOrders);
router.get('/:id', verifyUser, getOrderById);

// Vendor Fulfillment Routes
router.get('/vendor/list', verifyUser, authorizeRoles('vendor'), requireApprovedVendor, getVendorOrders);
router.patch('/vendor/:id/item-status', verifyUser, authorizeRoles('vendor'), requireApprovedVendor, updateVendorItemStatus);

// Admin Global Orders Route
router.get('/admin/all', verifyUser, authorizeRoles('admin'), getAdminOrders);

module.exports = router;
