const express = require('express');
const router = express.Router();
const menuRoutes = require('./menuRoutes');
const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const categoryRoutes = require('./categoryRoutes');
const { healthCheck } = require('../controllers/menuController');

console.log('✅ main index router loaded');

// Health check route
router.get('/health', healthCheck);

// Public routes
router.use('/menu', menuRoutes);
router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);

// Admin routes (protected)
router.use('/admin', adminRoutes);

module.exports = router;