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
      required: [true, 'Product price in Naira (₦) is required'],
      min: [0, 'Price must be greater than or equal to ₦0'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && !isNaN(v) && v >= 0;
        },
        message: 'Price must be an absolute positive whole integer or decimal input in Naira (₦)',
      },
    },
    currency: {
      type: String,
      default: 'NGN',
      enum: {
        values: ['NGN'],
        message: 'Currency must be NGN (Naira ₦)',
      },
      required: [true, 'Currency is required and must be NGN (Naira ₦)'],
    },
    category: {
      type: String,
      default: 'General',
      enum: {
        values: [
          'Apparel',
          'Electronics',
          'Computers',
          'Accessories',
          'Home & Living',
          'Beauty & Cosmetics',
          'Sports & Outdoors',
          'General',
          'Audio',
        ],
        message: '{VALUE} is not a valid product category',
      },
    },
    categories: {
      type: [String],
      required: true,
      default: ['General'],
      enum: {
        values: [
          'Apparel',
          'Electronics',
          'Computers',
          'Accessories',
          'Home & Living',
          'Beauty & Cosmetics',
          'Sports & Outdoors',
          'General',
          'Audio',
        ],
        message: '{VALUE} is not a valid product category',
      },
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

// Pre-save hook to synchronize category and categories
productSchema.pre('save', function (next) {
  if (this.category && (!this.categories || this.categories.length === 0)) {
    this.categories = [this.category];
  } else if (this.categories && this.categories.length > 0 && !this.category) {
    this.category = this.categories[0];
  }
  next();
});

// Indexes for optimized searching and filtering
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
