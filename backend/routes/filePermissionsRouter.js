const express = require('express');
const router = express.Router();
const filePermissionsController = require('../controllers/filePermissionsController');

// Ruta para obtener archivos compartidos con un usuario
router.get('/shared-files', filePermissionsController.getSharedFiles);
router.get('/file-permissions', filePermissionsController.getPermissionsByFile);
router.delete('/file-permission', filePermissionsController.revokePermission);
router.put('/file-permission', filePermissionsController.updatePermission);
router.get('/public-files', filePermissionsController.getPublicFiles);

module.exports = router;
