const express = require('express');
const {
  saveProduct,
  getProducts,
  getAllProducts,
  getProductById,
  getCategories,
} = require('../controllers/product.controller');
const { verifyUser } = require('../controllers/auth.controller');

const { upload } = require('../config/cloudinary');

const router = express.Router();

/**
 * Class routes matching instructor setup
 */
router.post('/create', verifyUser, upload.single('image'), saveProduct);
router.get('/getproducts', getProducts);

/**
 * Public catalog routes
 */
router.get('/categories/all', getCategories);
router.get('/categories', getCategories);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

module.exports = router;
