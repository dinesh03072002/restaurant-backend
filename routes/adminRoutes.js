const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadImage
} = require('../controllers/menuController');
const {
    getOrders,
    getOrderById,
    updateOrderStatus
} = require('../controllers/orderController');

// All admin routes require authentication
router.use(verifyToken, isAdmin);

// Image upload route
router.post('/upload', upload.single('image'), uploadImage);

// Menu management
const menuValidation = [
    body('name').notEmpty().trim(),
    body('price').isNumeric(),
    body('category_id').isInt()
];

router.post('/menu', menuValidation, createMenuItem);
router.put('/menu/:id', menuValidation, updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

// Order management
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;