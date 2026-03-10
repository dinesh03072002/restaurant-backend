const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    sendOTP,
    verifyOTP,
    resendOTP
} = require('../controllers/otpController');

// Validation rules
const mobileValidation = [
    body('mobile')
        .notEmpty()
        .withMessage('Mobile number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Valid Indian mobile number required')
];

const otpValidation = [
    ...mobileValidation,
    body('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must be numeric')
];

// Routes
router.post('/send', mobileValidation, sendOTP);
router.post('/verify', otpValidation, verifyOTP);
router.post('/resend', mobileValidation, resendOTP);

module.exports = router;