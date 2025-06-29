const express = require('express');
const router = express.Router();
const filePermissionsController = require('../controllers/filePermissionsController');

// Ruta para obtener archivos compartidos con un usuario
router.get('/shared-files', filePermissionsController.getSharedFiles);

module.exports = router;
