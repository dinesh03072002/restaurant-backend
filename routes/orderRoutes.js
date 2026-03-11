const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createOrder } = require('../controllers/orderController');

console.log('orderRoutes loaded');

const orderValidation = [
    body('customer_name').notEmpty().trim(),
    body('customer_phone').notEmpty(),
    body('customer_address').notEmpty(),
    body('items').isArray({ min: 1 })
];

// Public route for creating orders
router.post('/', orderValidation, createOrder);

module.exports = router;