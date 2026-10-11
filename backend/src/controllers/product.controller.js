const mongoose = require('mongoose');
const Product = require('../models/Product');
const VendorProfile = require('../models/VendorProfile');
const { uploadStreamToCloudinary } = require('../config/cloudinary');

/**
 * Class-compatible saveProduct / createProd controller
 * Supports productName, productPrice, productQuantity, description, category
 */
const saveProduct = async (req, res, next) => {
  try {
    const {
      title,
      productName,
      description,
      price,
      productPrice,
      categories,
      category,
      stock,
      productQuantity,
      images,
    } = req.body;

    const { role } = req.user || {};

    if (role !== 'admin' && role !== 'vendor') {
      return res.status(403).json({
        message: 'Forbidden resource',
      });
    }

    const effectiveTitle = title || productName;
    const effectivePrice = price !== undefined ? price : productPrice;
    const effectiveStock = stock !== undefined ? stock : productQuantity;

    if (!effectiveTitle || effectivePrice === undefined) {
      return res.status(400).json({
        message: 'Product creation failed: productName/title and productPrice/price are required.',
      });
    }

    // Combine image URLs from body and Cloudinary upload
    let finalImages = Array.isArray(images) ? [...images] : [];
    if (typeof images === 'string') {
      finalImages.push(images);
    }
    
    if (req.file) {
      if (req.file.path) {
        finalImages.push(req.file.path);
      } else if (req.file.buffer) {
        const uploadResult = await uploadStreamToCloudinary(req.file.buffer);
        if (uploadResult && uploadResult.secure_url) {
          finalImages.push(uploadResult.secure_url);
        }
      }
    }
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        if (f.path) {
          finalImages.push(f.path);
        } else if (f.buffer) {
          const res = await uploadStreamToCloudinary(f.buffer);
          if (res && res.secure_url) finalImages.push(res.secure_url);
        }
      }
    }

    let vendorProfile = req.vendorProfile;
    if (!vendorProfile && role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ user: req.user.id });
    }

    const effectiveCategory = category || (Array.isArray(categories) && categories[0]) || 'General';

    const product = await Product.create({
      vendor: vendorProfile ? vendorProfile._id : req.user.id,
      user: req.user.id,
      title: effectiveTitle.trim(),
      description: description || 'No description provided',
      price: parseFloat(effectivePrice),
      category: effectiveCategory,
      categories: Array.isArray(categories) && categories.length > 0
        ? categories
        : [effectiveCategory],
      stock: parseInt(effectiveStock || 0),
      images: finalImages,
      isActive: true,
    });

    return res.status(201).json({
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Product Creation Error:', error);
    return res.status(400).json({
      message: 'Product creation failed',
      error: error.message,
    });
  }
};

/**
 * Class-compatible getProducts controller
 */
const getProducts = async (req, res, next) => {
  try {
    const { category } = req.query;
    const approvedProfiles = await VendorProfile.find({ verificationStatus: 'approved' }).select('_id').lean();
    const approvedVendorIds = approvedProfiles.map((v) => v._id);

    const query = {
      isActive: true,
      vendor: { $in: approvedVendorIds },
    };

    if (category) {
      query.$or = [
        { category: category },
        { categories: category },
      ];
    }

    const products = await Product.find(query)
      .populate('user', 'firstname lastname email')
      .populate('vendor', 'storeName verificationStatus');

    return res.status(200).json({
      message: 'Products fetched successfully',
      data: products,
      products,
    });
  } catch (error) {
    console.error('getProducts Error:', error);
    return res.status(400).json({
      message: 'Cannot fetch products at this time',
    });
  }
};

/**
 * @route GET /api/products
 * Full multi-vendor search & pagination
 */
const getAllProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      vendorId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    let approvedVendorIds = [];
    if (mongoose.connection.readyState !== 0) {
      const approvedProfiles = await VendorProfile.find({ verificationStatus: 'approved' }).select('_id').lean();
      approvedVendorIds = approvedProfiles.map((v) => v._id);
    }

    const query = {
      isActive: true,
      vendor: { $in: approvedVendorIds },
    };

    if (category) {
      query.$or = [
        { category: category },
        { categories: category },
      ];
    }

    if (vendorId) {
      // If a specific vendor is requested, ensure it's approved
      if (approvedVendorIds.some((id) => id.toString() === vendorId.toString())) {
        query.vendor = vendorId;
      } else {
        return res.status(200).json({
          success: true,
          message: 'Products fetched successfully',
          count: 0,
          total: 0,
          page: parseInt(page),
          pages: 1,
          data: [],
          products: [],
        });
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { categories: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: 'vendor',
          select: 'storeName description verificationStatus contactEmail',
        })
        .populate('user', 'firstname lastname email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: products,
      products,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'vendor',
        select: 'storeName description verificationStatus contactEmail phone',
      })
      .populate('user', 'firstname lastname email');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or currently unavailable.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product details fetched successfully',
      data: product,
      product,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/products/categories/all
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('categories', { isActive: true });
    return res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories,
      categories,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveProduct,
  createProd: saveProduct, // Class alias
  getProducts,
  getAllProducts,
  getProductById,
  getCategories,
};
