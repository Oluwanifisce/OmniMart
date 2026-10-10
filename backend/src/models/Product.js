const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: [true, 'Product must belong to a vendor profile'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product must reference owning user'],
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    categories: {
      type: [String],
      required: true,
      default: ['General'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized searching and filtering
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ categories: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
