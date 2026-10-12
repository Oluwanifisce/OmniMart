const express = require('express');
const {
  registerUser,
  registerVendor,
  loginUser,
  getUsers,
  verifyUser,
  getMe,
  googleAuth,
  verifyOTP,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/v1/register — Stage 1: send OTP
router.post('/register', registerUser);

// POST /api/v1/vendor/register
router.post('/vendor/register', registerVendor);

// POST /api/v1/login
router.post('/login', loginUser);

// POST /api/v1/auth/google — Google OAuth sign-in / sign-up
router.post('/auth/google', googleAuth);

// POST /api/v1/auth/verify-otp — Stage 2: verify OTP, create user, send welcome email
router.post('/auth/verify-otp', verifyOTP);

// POST /api/v1/auth/forgot-password — Send password reset OTP email
router.post('/auth/forgot-password', forgotPassword);

// POST /api/v1/auth/reset-password — Verify reset code & update password
router.post('/auth/reset-password', resetPassword);
router.post('/reset-password', resetPassword);
router.post('/auth/verify-reset-code', resetPassword);

// GET /api/v1/getusers
router.get('/getusers', verifyUser, getUsers);

// GET /api/v1/me
router.get('/me', verifyUser, getMe);

module.exports = router;
