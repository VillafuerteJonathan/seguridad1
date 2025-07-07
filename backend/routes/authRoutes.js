const express = require('express');
const router = express.Router();
const { register, updateUserRole, updateLoginPermission } = require('../controllers/authController');
const { login } = require('../controllers/loginController');

router.post('/register', register);
router.post('/login', login);
router.put('/update-role', updateUserRole);
router.put('/update-login-permission', updateLoginPermission);


module.exports = router;
