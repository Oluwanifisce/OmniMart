const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');

/**
 * Middleware to verify JWT token and inject authenticated user into req.user.
 * Also populates req.vendorProfile if user role is 'vendor'.
 */
const authenticateToken = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Access token is missing.',
      });
    }

    const secret = process.env.JWT_SECRET || 'omnimart_jwt_super_secret_key_change_in_production_2026';
    const decoded = jwt.verify(token, secret);

    let user = null;
    if (mongoose.connection.readyState !== 0) {
      user = await User.findById(decoded.id);
    } else {
      user = { _id: decoded.id, email: decoded.email, role: decoded.role };
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. User no longer exists.',
      });
    }

    req.user = user;

    // Attach vendor profile if user is a vendor and DB is connected
    if (user.role === 'vendor' && mongoose.connection.readyState !== 0) {
      const vendorProfile = await VendorProfile.findOne({ user: user._id });
      req.vendorProfile = vendorProfile;
    }

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Invalid access token.',
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Token has expired.',
      });
    }
    next(err);
  }
};

module.exports = { authenticateToken };
