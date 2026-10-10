const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cart.controller');
const { verifyUser } = require('../controllers/auth.controller');

const router = express.Router();

router.use(verifyUser);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
