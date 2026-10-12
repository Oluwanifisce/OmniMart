const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const mongoose = require('mongoose');

// ADMIN DASHBOARD PIPELINE: Global revenue and platform counts
router.get('/admin/analytics', async (req, res) => {
  try {
    const globalSales = await Order.aggregate([
      { $match: { $or: [{ status: 'paid' }, { 'paymentInfo.status': 'paid' }] } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 } } }
    ]);
    return res.status(200).json(globalSales[0] || { totalRevenue: 0, totalOrders: 0 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// VENDOR DASHBOARD PIPELINE: Filters items by line-item vendorId property
router.get('/vendor/analytics/:vendorId', async (req, res) => {
  try {
    let vendorMongoId = null;
    if (mongoose.Types.ObjectId.isValid(req.params.vendorId)) {
      vendorMongoId = new mongoose.Types.ObjectId(req.params.vendorId);
    }

    const matchVendor = vendorMongoId
      ? { $or: [{ 'items.vendorId': vendorMongoId }, { 'items.vendor': vendorMongoId }] }
      : { 'items.vendorId': req.params.vendorId };

    const vendorSales = await Order.aggregate([
      { $match: { $or: [{ status: 'paid' }, { 'paymentInfo.status': 'paid' }] } },
      { $unwind: '$items' },
      { $match: matchVendor },
      {
        $group: {
          _id: null,
          vendorRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          itemsSold: { $sum: '$items.quantity' }
        }
      }
    ]);
    return res.status(200).json(vendorSales[0] || { vendorRevenue: 0, itemsSold: 0 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
