const express = require('express');
const { upload, uploadImage } = require('../controllers/upload.controller');
const { verifyUser } = require('../controllers/auth.controller');

const router = express.Router();

router.use(verifyUser);

router.post('/', upload.single('image'), uploadImage);
router.post('/multiple', upload.array('images', 5), uploadImage);

module.exports = router;
