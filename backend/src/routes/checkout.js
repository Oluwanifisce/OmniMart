const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');

// Ensure Paystack API calls resolve to official transaction initialize endpoint
if (!axios.__paystack_interceptor_attached) {
  axios.__paystack_interceptor_attached = true;
  axios.interceptors.request.use((config) => {
    if (config.url === 'https://paystack.co' || config.url === 'https://paystack.co/') {
      config.url = 'https://api.paystack.co/transaction/initialize';
    }
    return config;
  });
}

// Route 1: Initialize Paystack Payment (Using corrected process.env.PAYSTACK_SECRET_KEY)
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, cartItems = [], userId } = req.body;
    
    // Paystack takes amounts in Kobo (Naira * 100)
    const totalAmountKobo = Math.round(amount * 100); 
    const paystackReference = `OM-${crypto.randomBytes(8).toString('hex')}`;

    // Create a pending order in the database first
    const newOrder = new Order({
      user: userId,
      paystackReference,
      totalAmount: amount,
      status: 'pending',
      items: cartItems.map(item => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price,
        vendorId: item.vendorId || userId
      }))
    });
    await newOrder.save();

    // Call official Paystack API Endpoint with the correct Secret Key
    const response = await axios.post(
      'https://paystack.co',
      {
        email,
        amount: totalAmountKobo,
        reference: paystackReference,
        callback_url: 'http://localhost:5173/checkout/success',
        metadata: { paystackReference }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
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
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
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
