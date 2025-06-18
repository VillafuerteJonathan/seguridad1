const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('pdf'), fileController.uploadFile);

module.exports = router;
