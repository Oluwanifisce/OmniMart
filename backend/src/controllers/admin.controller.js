const mongoose = require('mongoose');
const VendorProfile = require('../models/VendorProfile');
const User = require('../models/User');
const Product = require('../models/Product');
const sendEmail = require('../utils/emailService');

/**
 * @route   GET /api/admin/vendors
 * @desc    Get list of all vendor profiles with filter options
 * @access  Private (Admin Only)
 */
const getAllVendors = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.verificationStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vendors, total] = await Promise.all([
      VendorProfile.find(query)
        .populate('user', 'firstname lastname name email role createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      VendorProfile.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: vendors.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      vendors,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/admin/vendors/:id
 * @desc    Get detailed vendor profile by vendor profile ID
 * @access  Private (Admin Only)
 */
const getVendorById = async (req, res, next) => {
  try {
    const vendor = await VendorProfile.findById(req.params.id).populate('user', 'name email role createdAt');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found.',
      });
    }

    const productCount = await Product.countDocuments({ vendor: vendor._id });

    return res.status(200).json({
      success: true,
      vendor,
      stats: {
        totalProducts: productCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/admin/vendors/:id/status
 * @desc    Approve, reject, or suspend a vendor & update commission rate
 * @access  Private (Admin Only)
 */
const updateVendorStatus = async (req, res, next) => {
  try {
    const { verificationStatus, commissionRate } = req.body;

    const vendor = await VendorProfile.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found.',
      });
    }

    if (verificationStatus) {
      if (!['pending', 'approved', 'rejected', 'suspended'].includes(verificationStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid verification status value. Allowed: pending, approved, rejected, suspended',
        });
      }
      vendor.verificationStatus = verificationStatus;
    }

    if (commissionRate !== undefined) {
      const parsedRate = parseFloat(commissionRate);
      if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
        return res.status(400).json({
          success: false,
          error: 'Commission rate must be a number between 0 and 100.',
        });
      }
      vendor.commissionRate = parsedRate;
    }

    await vendor.save();
    await vendor.populate('user', 'firstname lastname name email role');

    // Trigger Nodemailer approval notification email
    if (verificationStatus === 'approved') {
      try {
        const vendorEmail = vendor.contactEmail || vendor.user?.email;
        const vendorName = vendor.storeName || vendor.user?.firstname || 'Vendor Partner';
        if (vendorEmail) {
          const subject = 'OmniMart Multi-Vendor Account Approved! 🚀';
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #10B981; margin-bottom: 16px;">OmniMart Vendor Network</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>${vendorName}</strong>,<br><br>
                Great news! Your OmniMart Vendor Application has been officially reviewed and fully approved by our administrative panel. Your digital storefront is now active and unlocked. You can log into your dashboard right now to select your native product categories, upload your inventory priced in Naira, and start accepting live customer orders instantly! Welcome to the OmniMart Vendor Network!<br><br>
                — The OmniMart Admin Core Team
              </p>
            </div>
          `;
          await sendEmail(vendorEmail, subject, `Hello ${vendorName}, Your OmniMart Vendor Application has been approved!`, html);
        }
      } catch (emailErr) {
        console.warn('Vendor approval email dispatch error:', emailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Vendor '${vendor.storeName}' verification status updated to '${vendor.verificationStatus}'.`,
      vendor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/admin/analytics
 * @desc    Get global platform analytics and summary metrics
 * @access  Private (Admin Only)
 */
const getGlobalAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      usersByRole,
      vendorsByStatus,
      totalProducts,
      activeProducts,
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      VendorProfile.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
      ]),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
    ]);

    // Format metrics into clean key-value structures
    const roleCounts = { admin: 0, vendor: 0, customer: 0 };
    usersByRole.forEach((item) => {
      if (item._id) roleCounts[item._id] = item.count;
    });

    const vendorCounts = { pending: 0, approved: 0, rejected: 0, suspended: 0 };
    vendorsByStatus.forEach((item) => {
      if (item._id) vendorCounts[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          breakdown: roleCounts,
        },
        vendors: {
          total: Object.values(vendorCounts).reduce((a, b) => a + b, 0),
          breakdown: vendorCounts,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  updateVendorStatus,
  getGlobalAnalytics,
};
