const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');

// Multer Memory Storage Configuration (Vercel read-only serverless compatible)
const storage = multer.memoryStorage();

// File filter accepting images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter,
});

/**
 * Stream memory buffer directly to Cloudinary
 */
const uploadStreamToCloudinary = (fileBuffer, folder = 'omnimart_uploads') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Controller to handle image upload single or multiple
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    if (req.file) {
      const result = await uploadStreamToCloudinary(req.file.buffer);
      return res.status(200).json({
        message: 'Image uploaded successfully',
        url: result.secure_url,
        filename: result.public_id,
      });
    }

    const uploadPromises = req.files.map((file) => uploadStreamToCloudinary(file.buffer));
    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.secure_url);

    return res.status(200).json({
      message: 'Images uploaded successfully',
      urls,
    });
  } catch (error) {
    console.error('Cloudinary stream upload error:', error);
    return res.status(500).json({
      message: 'Failed to upload image to cloud storage',
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  uploadImage,
  uploadStreamToCloudinary,
};
