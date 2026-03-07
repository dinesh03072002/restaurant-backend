const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategoryById
} = require('../controllers/categoryController');

// @route   GET /api/categories
// @desc    Get all categories
router.get('/', getCategories);

// @route   GET /api/categories/:id
// @desc    Get single category
router.get('/:id', getCategoryById);

module.exports = router;