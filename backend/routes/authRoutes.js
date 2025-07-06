const express = require('express');
const router = express.Router();
const { register, updateUserRole } = require('../controllers/authController');
const { login } = require('../controllers/loginController');

router.post('/register', register);
router.post('/login', login);
router.put('/update-role', updateUserRole);


module.exports = router;
