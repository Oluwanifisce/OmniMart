const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting multiple reviews for the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to recalculate average product rating
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const obj = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        numReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    const Product = mongoose.model('Product');
    if (obj.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        numReviews: obj[0].numReviews,
        averageRating: Math.round(obj[0].averageRating * 10) / 10,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        numReviews: 0,
        averageRating: 0,
      });
    }
  } catch (err) {
    console.error('Error updating average rating:', err);
  }
};

// Recalculate average rating after saving
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.product);
});

// Recalculate average rating after removing
reviewSchema.post('remove', function () {
  this.constructor.calculateAverageRating(this.product);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
