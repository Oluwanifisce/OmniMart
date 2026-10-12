const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Route 1: Initialize Paystack Payment (Uses pre-configured .env key)
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, cartItems = [], userId, user: reqUser, callback_url } = req.body;
    
    const effectiveUserId = userId || reqUser?._id || reqUser?.id || (req.user && req.user._id);
    if (!effectiveUserId) {
      return res.status(400).json({ error: 'User ID is required to initialize checkout' });
    }

    const totalAmountKobo = Math.round(Number(amount) * 100); // Paystack takes amounts in Kobo
    const paystackReference = `OM-${crypto.randomBytes(8).toString('hex')}`;

    // Map cart items and ensure vendorId is resolved
    const mappedItems = [];
    for (const item of cartItems) {
      let resolvedVendorId = item.vendorId || item.vendor?._id || item.vendor;
      if (!resolvedVendorId && item._id) {
        try {
          const prodDoc = await Product.findById(item._id).select('vendor user');
          if (prodDoc) {
            resolvedVendorId = prodDoc.user || prodDoc.vendor;
          }
        } catch (_) {}
      }
      if (!resolvedVendorId) {
        resolvedVendorId = effectiveUserId;
      }

      mappedItems.push({
        product: item._id || item.product?._id || item.productId,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        title: item.title || item.name || '',
        vendorId: resolvedVendorId,
      });
    }

    // Create a pending order in the database first
    const newOrder = new Order({
      user: effectiveUserId,
      paystackReference,
      totalAmount: Number(amount),
      status: 'pending',
      orderStatus: 'pending',
      items: mappedItems,
    });
    await newOrder.save();

    const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.Test_Secret_Key;

    // Call Paystack API using the pre-configured secret key from env
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: totalAmountKobo,
        reference: paystackReference,
        callback_url: callback_url || 'http://localhost:5173/checkout/success',
        metadata: { paystackReference, orderId: newOrder._id }
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json(response.data.data);
  } catch (error) {
    console.error('Paystack Initialization Error:', error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// Route 2: Paystack Webhook Listener (Updates Dashboards instantly)
router.post('/webhook', async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.Test_Secret_Key;
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // Verify request signature is genuinely from Paystack
    const signature = req.headers['x-paystack-signature'];
    if (signature && hash !== signature) {
      console.warn('Paystack Webhook: Signature mismatch');
      return res.sendStatus(400);
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const reference = data.reference;

      // Find the pending order and mark as paid. 
      // This allows aggregation queries to instantly reflect items on the proper dashboard streams.
      await Order.findOneAndUpdate(
        { paystackReference: reference },
        { 
          status: 'paid',
          orderStatus: 'processing',
          'paymentInfo.status': 'paid',
          'paymentInfo.transactionId': data.id ? String(data.id) : reference,
        }
      );
      console.log(`[Paystack Webhook] Order with reference ${reference} marked as PAID`);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('Paystack Webhook Error:', err.message);
    return res.sendStatus(500);
  }
});

// Route 3: Client Verify Order Endpoint
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.Test_Secret_Key;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (response.data?.data?.status === 'success') {
      const updatedOrder = await Order.findOneAndUpdate(
        { paystackReference: reference },
        { 
          status: 'paid',
          orderStatus: 'processing',
          'paymentInfo.status': 'paid',
          'paymentInfo.transactionId': String(response.data.data.id || reference),
        },
        { new: true }
      );
      return res.status(200).json({ success: true, order: updatedOrder });
    } else {
      return res.status(400).json({ success: false, message: 'Transaction not successful' });
    }
  } catch (error) {
    console.error('Paystack Verify Error:', error.response?.data || error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
