const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('pdf'), fileController.uploadFile);
router.get('/user-files', fileController.getUserFiles);
router.delete('/delete-file', fileController.deleteFile);

module.exports = router;

