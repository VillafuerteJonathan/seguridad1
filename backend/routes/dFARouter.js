const express = require('express');
const router = express.Router();

const twoFAController = require('../controllers/twoFAController');

// Rutas 2FA
router.post('/enable-2fa', twoFAController.enable2FA);
router.post('/disable-2fa', twoFAController.disable2FA);
router.post('/verify-2fa', twoFAController.verify2FA);
router.get('/get-qr-code', twoFAController.getQRCode);

module.exports = router;
