const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { getResources, uploadResource, getDashboard } = require('../controllers/resourceController');

// GET /api/resources  (herkese açık)
router.get('/', getResources);

// POST /api/resources/upload  (login gerekli + dosya)
router.post('/upload', authMiddleware, upload.single('file'), uploadResource);

// GET /api/resources/dashboard  (login gerekli)
router.get('/dashboard', authMiddleware, getDashboard);

module.exports = router;
