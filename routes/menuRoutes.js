const express = require('express');
const router = express.Router();
const {
    getMenuItems,
    getMenuItemById,
    getMenuItemsByCategory,
    getCategories
} = require('../controllers/menuController');


router.get('/', getMenuItems);
router.get('/categories', getCategories);
router.get('/category/:category', getMenuItemsByCategory);
router.get('/:id', getMenuItemById);

module.exports = router;