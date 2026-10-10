const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otpCode: {
    type: String,
    required: true,
  },
  registrationData: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Automatically delete document after 10 minutes (600 seconds)
  }
});

module.exports = mongoose.model('OTPVerification', otpVerificationSchema);
