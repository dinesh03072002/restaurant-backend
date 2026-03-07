const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, register, getMe } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/auth');

console.log('✅ authRoutes loaded');

// Login validation
const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

// Register validation
const registerValidation = [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
];

// Public routes
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', verifyToken, getMe);
router.post('/register', verifyToken, isAdmin, registerValidation, register);

module.exports = router;