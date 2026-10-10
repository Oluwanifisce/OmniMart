const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${basename}_${Date.now()}${ext}`);
  },
});

// File filter accepting images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
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
 * Controller to handle image upload single or multiple
 */
const uploadImage = (req, res) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  if (req.file) {
    const url = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      message: 'Image uploaded successfully',
      url,
      filename: req.file.filename,
    });
  }

  const urls = req.files.map((file) => `/uploads/${file.filename}`);
  return res.status(200).json({
    message: 'Images uploaded successfully',
    urls,
  });
};

module.exports = {
  upload,
  uploadImage,
};
