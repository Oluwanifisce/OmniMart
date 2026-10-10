const express = require('express');
const {
  createReview,
  getProductReviews,
  deleteReview,
} = require('../controllers/review.controller');
const { verifyUser } = require('../controllers/auth.controller');

const router = express.Router();

// Public route to fetch reviews
router.get('/products/:productId/reviews', getProductReviews);

// Protected routes to post and delete reviews
router.post('/products/:productId/reviews', verifyUser, createReview);
router.delete('/reviews/:id', verifyUser, deleteReview);

module.exports = router;
