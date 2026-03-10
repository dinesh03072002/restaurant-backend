const express = require('express');
const router = express.Router();
const menuRoutes = require('./menuRoutes');
const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const categoryRoutes = require('./categoryRoutes');
const otpRoutes = require('./otpRoutes'); 
const customerRoutes = require('./customerRoutes');
const { healthCheck } = require('../controllers/menuController');

// PUBLIC ROUTES - No authentication needed
router.get('/health', healthCheck);
router.use('/menu', menuRoutes);
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);

// PROTECTED ROUTES - Need authentication
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/customer', customerRoutes);

module.exports = router;