const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/loginController');

router.get('/', getAllUsers);

module.exports = router;
