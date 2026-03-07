const express = require('express');
const router = express.Router();
const {
    getMenuItems,
    getMenuItemById,
    getMenuItemsByCategory,
    getCategories
} = require('../controllers/menuController');

// Log to verify imports are working
console.log('✅ menuRoutes loaded - functions:', Object.keys({
    getMenuItems,
    getMenuItemById,
    getMenuItemsByCategory,
    getCategories
}));

// @route   GET /api/menu
// @desc    Get all menu items
router.get('/', getMenuItems);

// @route   GET /api/menu/categories
// @desc    Get all categories
router.get('/categories', getCategories);

// @route   GET /api/menu/category/:category
// @desc    Get items by category
router.get('/category/:category', getMenuItemsByCategory);

// @route   GET /api/menu/:id
// @desc    Get single menu item
router.get('/:id', getMenuItemById);

module.exports = router;