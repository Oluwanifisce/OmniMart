const Review = require('../models/Review');
const Product = require('../models/Product');

/**
 * @route POST /api/v1/products/:productId/reviews
 * @desc Create a review for a product
 * @access Private
 */
const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating: parseInt(rating),
      comment: comment.trim(),
    });

    await review.populate('user', 'firstname lastname email');

    return res.status(201).json({
      message: 'Review added successfully',
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/v1/products/:productId/reviews
 * @desc Fetch reviews for a product
 * @access Public
 */
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate('user', 'firstname lastname')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Product reviews fetched successfully',
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route DELETE /api/v1/reviews/:id
 * @desc Delete a review
 * @access Private (Author or Admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. You can only delete your own reviews.' });
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate average rating
    await Review.calculateAverageRating(productId);

    return res.status(200).json({
      message: 'Review deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  deleteReview,
};
