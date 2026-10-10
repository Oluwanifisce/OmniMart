const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * @route GET /api/v1/cart
 * @desc Get user's active shopping cart
 * @access Private
 */
const getCart = async (req, res, next) => {
  try {
    const query = Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'title price images stock vendor isActive',
        populate: { path: 'vendor', select: 'storeName verificationStatus' },
      });
    let cart = typeof query.lean === 'function' ? await query.lean() : await query;

    if (!cart) {
      const created = await Cart.create({ user: req.user.id, items: [] });
      cart = typeof created.toObject === 'function' ? created.toObject() : created;
    }

    return res.status(200).json({
      message: 'Cart fetched successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/v1/cart
 * @desc Add item to shopping cart
 * @access Private
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${product.stock} available.` });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      const newQuantity = cart.items[existingIndex].quantity + parseInt(quantity);
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: `Cannot add more. Max stock available: ${product.stock}` });
      }
      cart.items[existingIndex].quantity = newQuantity;
      cart.items[existingIndex].price = product.price;
    } else {
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity),
        price: product.price,
      });
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'title price images stock vendor',
      })
      .lean();

    return res.status(200).json({
      message: 'Item added to cart successfully',
      data: populatedCart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route PUT /api/v1/cart/items/:productId
 * @desc Update quantity of item in cart (Atomic MongoDB Update)
 * @access Private
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const targetQty = parseInt(quantity);
    if (isNaN(targetQty) || targetQty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId).lean();
    if (product && product.stock < targetQty) {
      return res.status(400).json({ message: `Cannot update quantity. Only ${product.stock} available.` });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id, 'items.product': productId },
      { $set: { 'items.$.quantity': targetQty } },
      { new: true }
    )
      .populate({
        path: 'items.product',
        select: 'title price images stock vendor',
      })
      .lean();

    if (!cart) {
      return res.status(404).json({ message: 'Cart or item not found' });
    }

    return res.status(200).json({
      message: 'Cart item updated successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route DELETE /api/v1/cart/items/:productId
 * @desc Remove item from cart (Atomic MongoDB Pull)
 * @access Private
 */
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { items: { product: productId } } },
      { new: true }
    )
      .populate({
        path: 'items.product',
        select: 'title price images stock vendor',
      })
      .lean();

    return res.status(200).json({
      message: 'Item removed from cart',
      data: cart || { items: [] },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route DELETE /api/v1/cart
 * @desc Clear all items from cart (Atomic MongoDB Reset)
 * @access Private
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [] } },
      { new: true }
    ).lean();

    return res.status(200).json({
      message: 'Cart cleared successfully',
      data: cart || { user: req.user.id, items: [] },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
