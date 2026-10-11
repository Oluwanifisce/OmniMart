const VendorProfile = require('../models/VendorProfile');
const Product = require('../models/Product');

/**
 * @route   GET /api/vendor/profile
 * @desc    Get store profile of authenticated vendor
 * @access  Private (Vendor Only)
 */
const getVendorProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const vendor = await VendorProfile.findOne({ user: userId }).populate('user', 'name email role');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      vendor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/vendor/profile
 * @desc    Update store details of authenticated vendor
 * @access  Private (Vendor Only)
 */
const updateVendorProfile = async (req, res, next) => {
  try {
    const { storeName, description, storeDescription, contactEmail, phone, logo, businessAddress, bankDetails } = req.body;

    const userId = req.user._id || req.user.id;
    const vendor = await VendorProfile.findOne({ user: userId });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found.',
      });
    }

    if (storeName && storeName.trim() !== vendor.storeName) {
      const existingStore = await VendorProfile.findOne({
        storeName: storeName.trim(),
        _id: { $ne: vendor._id },
      });
      if (existingStore) {
        return res.status(400).json({
          success: false,
          error: 'Another store is already using this store name.',
        });
      }
      vendor.storeName = storeName.trim();
    }

    const effectiveDesc = description !== undefined ? description : storeDescription;
    if (effectiveDesc !== undefined) vendor.description = effectiveDesc;
    if (contactEmail !== undefined) vendor.contactEmail = contactEmail;
    if (phone !== undefined) vendor.phone = phone;
    if (logo !== undefined) vendor.logo = logo;
    if (businessAddress !== undefined) vendor.businessAddress = businessAddress;
    if (bankDetails !== undefined) vendor.bankDetails = { ...vendor.bankDetails, ...bankDetails };

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: 'Vendor profile updated successfully.',
      vendor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/vendor/products
 * @desc    Create a new product for the authenticated approved vendor
 * @access  Private (Approved Vendor Only)
 */
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, categories, category, stock, images, isActive } = req.body;
    const userId = req.user._id || req.user.id;
    const vendorProfile = req.vendorProfile || (await VendorProfile.findOne({ user: userId }));

    if (!vendorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found.',
      });
    }

    const effectiveCategory = category || (Array.isArray(categories) && categories[0]) || 'General';

    const product = await Product.create({
      vendor: vendorProfile._id,
      user: userId,
      title,
      description,
      price,
      category: effectiveCategory,
      categories: Array.isArray(categories) && categories.length > 0 ? categories : [effectiveCategory],
      stock: stock !== undefined ? stock : 0,
      images: Array.isArray(images) ? images : [],
      isActive: isActive !== undefined ? isActive : true,
    });


    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/vendor/products
 * @desc    Get all products belonging to authenticated vendor
 * @access  Private (Vendor Only)
 */
const getVendorProducts = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const vendorProfile = req.vendorProfile || (await VendorProfile.findOne({ user: userId }));

    if (!vendorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found.',
      });
    }

    const { page = 1, limit = 20, search } = req.query;
    const query = { vendor: vendorProfile._id };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/vendor/products/:id
 * @desc    Get specific product by ID belonging to authenticated vendor
 * @access  Private (Vendor Only)
 */
const getVendorProductById = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const vendorProfile = req.vendorProfile || (await VendorProfile.findOne({ user: userId }));


    const product = await Product.findOne({
      _id: req.params.id,
      vendor: vendorProfile._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or does not belong to your store.',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/vendor/products/:id
 * @desc    Update a product belonging to authenticated approved vendor
 * @access  Private (Approved Vendor Only)
 */
const updateProduct = async (req, res, next) => {
  try {
    const vendorProfile = req.vendorProfile;

    let product = await Product.findOne({
      _id: req.params.id,
      vendor: vendorProfile._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or does not belong to your store.',
      });
    }

    const { title, description, price, categories, category, stock, images, isActive } = req.body;

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) {
      product.category = category;
      if (categories === undefined) product.categories = [category];
    }
    if (categories !== undefined) {
      product.categories = Array.isArray(categories) ? categories : [categories];
      if (category === undefined && product.categories.length > 0) product.category = product.categories[0];
    }
    if (stock !== undefined) product.stock = stock;
    if (images !== undefined) product.images = Array.isArray(images) ? images : [images];
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/vendor/products/:id
 * @desc    Delete a product belonging to authenticated approved vendor
 * @access  Private (Approved Vendor Only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const vendorProfile = req.vendorProfile;

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      vendor: vendorProfile._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or does not belong to your store.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVendorProfile,
  updateVendorProfile,
  createProduct,
  getVendorProducts,
  getVendorProductById,
  updateProduct,
  deleteProduct,
};
