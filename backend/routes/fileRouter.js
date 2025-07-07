const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');
const signatureController = require('../controllers/signatureController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('pdf'), fileController.uploadFile);
router.get('/user-files', fileController.getUserFiles);
router.delete('/delete-file', fileController.deleteFile);
router.post('/share-file', fileController.compartirArchivo);
router.get('/file-content', fileController.getFileContent);
router.put('/file-access', fileController.updateAccessLevel);
router.post('/verify-signature', signatureController.verifySignature);




module.exports = router;

