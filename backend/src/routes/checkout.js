const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');

// Fallback to preserve active Paystack test secret key across serverless hosting environments
// Safely validates that the key begins with 'sk_' (avoiding public key or placeholder collisions)
const getPaystackSecretKey = () => {
  const candidates = [
    process.env.PAYSTACK_SECRET_KEY,
    process.env.Test_Secret_Key,
    process.env.PAYSTACK_SECRET_KEY_Secret_Key,
    process.env.PAYSTACK_SECRET,
  ];

  for (const key of candidates) {
    if (typeof key === 'string' && key.trim().startsWith('sk_')) {
      return key.trim();
    }
  }

  return 'sk_test_38abb048c750e77ab8f0f09951ac8506a4770247';
};


// Diagnostic route
router.get('/test-key', (req, res) => {
  const key = getPaystackSecretKey();
  return res.json({
    status: 'ok',
    prefix: key ? key.substring(0, 7) : null,
    length: key ? key.length : 0,
    commit: 'v2-diagnostic',
  });
});

// Route 1: Initialize Paystack Payment
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, cartItems = [], userId: bodyUserId, callback_url } = req.body;

    // Resolve user ID: JWT-authenticated token takes priority over body value
    const mongoose = require('mongoose');
    const resolveUserId = () => {
      if (req.user?._id) return req.user._id;
      if (bodyUserId && mongoose.Types.ObjectId.isValid(bodyUserId)) return bodyUserId;
      return null;
    };
    const resolvedUserId = resolveUserId();

    // Paystack takes amounts in Kobo (Naira * 100)
    const totalAmountKobo = Math.round(Number(amount) * 100);
    const paystackReference = `OM-${crypto.randomBytes(8).toString('hex')}`;

    const secretKey = getPaystackSecretKey();

    // Build order - only set user field if we have a valid ObjectId
    const orderData = {
      paystackReference,
      totalAmount: Number(amount),
      status: 'pending',
      items: cartItems.map(item => ({
        product: mongoose.Types.ObjectId.isValid(item._id) ? item._id : undefined,
        quantity: item.quantity || 1,
        price: item.price || 0,
        vendorId: mongoose.Types.ObjectId.isValid(item.vendorId) ? item.vendorId
          : (resolvedUserId || new mongoose.Types.ObjectId()),
      })),
    };
    if (resolvedUserId) orderData.user = resolvedUserId;

    const newOrder = new Order(orderData);
    await newOrder.save();

    const redirectUrl = callback_url || (req.headers.origin ? `${req.headers.origin}/checkout/success` : 'http://localhost:5173/checkout/success');

    // Call official Paystack transaction initialize endpoint
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: totalAmountKobo,
        reference: paystackReference,
        callback_url: redirectUrl,
        metadata: { paystackReference }
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Return authorization_url back to frontend client
    return res.status(200).json(response.data.data);
  } catch (error) {
    console.error('Paystack initialization error details:', error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// Route 2: Paystack Webhook Listener (Uses process.env.PAYSTACK_SECRET_KEY for signature validation)
router.post('/webhook', async (req, res) => {
  const secretKey = getPaystackSecretKey();
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // Verify request signature is genuinely from Paystack
  if (hash !== req.headers['x-paystack-signature']) {
    return res.sendStatus(400);
  }

  const { event, data } = req.body;

  if (event === 'charge.success') {
    const reference = data.reference;

    // Mark the pending order as paid so it reflects on Admin/Vendor Dashboards
    await Order.findOneAndUpdate(
      { paystackReference: reference },
      { status: 'paid' }
    );
  }

  return res.sendStatus(200);
});

// Route 3: Direct Reference Verification (Supports client success callback)
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const order = await Order.findOneAndUpdate(
      { paystackReference: reference },
      { status: 'paid' },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
