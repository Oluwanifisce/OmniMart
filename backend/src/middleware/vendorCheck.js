const VendorProfile = require('../models/VendorProfile');

/**
 * Middleware enforcing vendor verification status checks.
 * Ensures that vendors attempting to manage products/store possess an 'approved' VendorProfile status.
 */
const requireApprovedVendor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. User authentication required.',
      });
    }

    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. User is not registered as a vendor.',
      });
    }

    let vendorProfile = req.vendorProfile;
    if (!vendorProfile) {
      const userId = req.user._id || req.user.id;
      vendorProfile = await VendorProfile.findOne({ user: userId });
      req.vendorProfile = vendorProfile;
    }


    if (!vendorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found. Please complete vendor setup.',
      });
    }

    if (vendorProfile.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        error: `Vendor operation rejected. Your store account status is '${vendorProfile.verificationStatus}'. Only 'approved' vendors can perform this action.`,
        verificationStatus: vendorProfile.verificationStatus,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireApprovedVendor };
