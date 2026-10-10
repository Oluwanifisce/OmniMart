const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const VendorProfile = require('../models/VendorProfile');
const sendEmail = require('../utils/emailService');

/**
 * @route POST /api/v1/orders
 * @desc Create new order from customer cart
 * @access Private (Customer/User)
 */
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'Credit Card' } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      return res.status(400).json({
        message: 'Shipping address details (street, city, postalCode, country) are required.',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty.' });
    }

    const orderItems = [];
    let totalAmount = 0;
    let commissionTotal = 0;

    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product '${item.product?.title || 'Item'}' is no longer available.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for '${product.title}'. Requested: ${item.quantity}, Available: ${product.stock}`,
        });
      }

      // Fetch vendor profile to compute commission
      const vendorProfile = await VendorProfile.findById(product.vendor);
      const commissionRate = vendorProfile ? vendorProfile.commissionRate : 10.0;
      const itemSubtotal = product.price * item.quantity;
      const itemCommission = (itemSubtotal * commissionRate) / 100;

      orderItems.push({
        product: product._id,
        vendor: product.vendor,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        itemStatus: 'pending',
      });

      totalAmount += itemSubtotal;
      commissionTotal += itemCommission;

      // Decrement stock count
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        status: 'paid',
        transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      },
      orderStatus: 'processing',
      totalAmount,
      commissionTotal,
    });

    // Clear user cart
    cart.items = [];
    await cart.save();

    // Send Invoice/Receipt Email
    try {
      await sendEmail(
        req.user.email,
        `Order Confirmation - ${order.paymentInfo.transactionId}`,
        `Hi,\n\nYour order has been placed successfully.\nTotal Amount: $${order.totalAmount.toFixed(2)}\nTransaction ID: ${order.paymentInfo.transactionId}\n\nThank you for shopping with OmniMart!`,
        `<h2>Order Confirmation</h2><p>Your order has been placed successfully.</p><p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p><p><strong>Transaction ID:</strong> ${order.paymentInfo.transactionId}</p><p>Thank you for shopping with OmniMart!</p>`
      );
    } catch (err) {
      console.error('Email sending failed during checkout:', err);
    }

    return res.status(201).json({
      message: 'Order placed successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/v1/orders/my-orders
 * @desc Get customer order history
 * @access Private
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.vendor', 'storeName contactEmail')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Customer orders fetched successfully',
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/v1/orders/:id
 * @desc Get order details by ID
 * @access Private
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstname lastname email')
      .populate('items.vendor', 'storeName contactEmail phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      message: 'Order details fetched successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/v1/vendor/orders
 * @desc Get orders containing items belonging to authenticated vendor
 * @access Private (Approved Vendor Only)
 */
const getVendorOrders = async (req, res, next) => {
  try {
    const vendorProfile = req.vendorProfile || (await VendorProfile.findOne({ user: req.user.id }));

    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found.' });
    }

    const orders = await Order.find({ 'items.vendor': vendorProfile._id })
      .populate('customer', 'firstname lastname email')
      .sort({ createdAt: -1 });

    // Filter items to show vendor-specific items
    const formattedOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendor.toString() === vendorProfile._id.toString()
      );
      const vendorSubtotal = vendorItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return {
        _id: order._id,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        vendorItems,
        vendorSubtotal,
      };
    });

    return res.status(200).json({
      message: 'Vendor orders fetched successfully',
      count: formattedOrders.length,
      data: formattedOrders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route PATCH /api/v1/vendor/orders/:id/item-status
 * @desc Vendor updates item fulfillment status for their store's products in an order
 * @access Private (Approved Vendor Only)
 */
const updateVendorItemStatus = async (req, res, next) => {
  try {
    const { itemStatus } = req.body;
    const vendorProfile = req.vendorProfile || (await VendorProfile.findOne({ user: req.user.id }));

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(itemStatus)) {
      return res.status(400).json({ message: 'Invalid item status value' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let updatedCount = 0;
    order.items.forEach((item) => {
      if (item.vendor.toString() === vendorProfile._id.toString()) {
        item.itemStatus = itemStatus;
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      return res.status(403).json({ message: 'Order does not contain items from your store.' });
    }

    // Update main orderStatus if all items are shipped or delivered
    const allStatuses = order.items.map((i) => i.itemStatus);
    if (allStatuses.every((s) => s === 'delivered')) {
      order.orderStatus = 'delivered';
    } else if (allStatuses.some((s) => s === 'shipped' || s === 'processing')) {
      order.orderStatus = 'shipped';
    }

    await order.save();

    return res.status(200).json({
      message: `Item status updated to '${itemStatus}' for ${updatedCount} items`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/v1/admin/orders
 * @desc List all platform orders and revenue breakdown
 * @access Private (Admin Only)
 */
const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'firstname lastname email')
      .populate('items.vendor', 'storeName')
      .sort({ createdAt: -1 });

    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCommissions = orders.reduce((sum, o) => sum + o.commissionTotal, 0);

    return res.status(200).json({
      message: 'All platform orders fetched',
      summary: {
        totalOrders: orders.length,
        totalSales: Math.round(totalSales * 100) / 100,
        totalPlatformCommission: Math.round(totalCommissions * 100) / 100,
      },
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getVendorOrders,
  updateVendorItemStatus,
  getAdminOrders,
};
