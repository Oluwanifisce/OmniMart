const mongoose = require('mongoose');

const vendorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor profile must be associated with a user'],
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
      trim: true,
    },
    businessAddress: {
      type: String,
      default: '',
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'suspended'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'pending',
    },
    commissionRate: {
      type: Number,
      default: 10.0, // 10% platform commission rate
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100%'],
    },
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const VendorProfile = mongoose.model('VendorProfile', vendorProfileSchema);

module.exports = VendorProfile;
