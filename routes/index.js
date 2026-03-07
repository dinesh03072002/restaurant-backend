const express = require('express');
const router = express.Router();
const menuRoutes = require('./menuRoutes');
const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const categoryRoutes = require('./categoryRoutes');
const { healthCheck } = require('../controllers/menuController');

// Public routes - NO AUTH REQUIRED
router.get('/health', healthCheck);
router.use('/menu', menuRoutes);        
router.use('/categories', categoryRoutes); 
router.use('/auth', authRoutes);         

// Protected routes - require authentication
router.use('/orders', orderRoutes);      
router.use('/admin', adminRoutes);        

module.exports = router;