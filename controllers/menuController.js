const db = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const MenuItem = db.MenuItem;
const Category = db.Category;


const getMenuItems = async (req, res) => {
    try {
        const { category, available, vegetarian } = req.query;
        
        const whereClause = {};
        
        if (available === 'true') {
            whereClause.is_available = true;
        }
        
        if (vegetarian === 'true') {
            whereClause.is_vegetarian = true;
        }
        
        const includeOptions = [{
            model: Category,
            as: 'category',
            required: false
        }];
        
        if (category) {
            includeOptions[0].where = {
                name: { [Op.like]: `%${category}%` }
            };
            includeOptions[0].required = true;
        }
        
        const menuItems = await MenuItem.findAll({
            where: whereClause,
            include: includeOptions,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            count: menuItems.length,
            data: menuItems
        });
    } catch (error) {
        console.error('Error in getMenuItems:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


const getMenuItemById = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByPk(req.params.id, {
            include: [{
                model: Category,
                as: 'category'
            }]
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: `Menu item with id ${req.params.id} not found`
            });
        }

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Error in getMenuItemById:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


const getMenuItemsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        const menuItems = await MenuItem.findAll({
            where: {
                is_available: true
            },
            include: [{
                model: Category,
                as: 'category',
                where: { 
                    name: category 
                },
                required: true
            }]
        });

        res.json({
            success: true,
            count: menuItems.length,
            category: category,
            data: menuItems
        });
    } catch (error) {
        console.error('Error in getMenuItemsByCategory:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { is_active: true },
            order: [['display_order', 'ASC']]
        });

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Error in getCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


const createMenuItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const menuItem = await MenuItem.create(req.body);

        const createdItem = await MenuItem.findByPk(menuItem.id, {
            include: [{
                model: Category,
                as: 'category'
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: createdItem
        });
    } catch (error) {
        console.error('Error in createMenuItem:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


const updateMenuItem = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        await menuItem.update(req.body);

        const updatedItem = await MenuItem.findByPk(req.params.id, {
            include: [{
                model: Category,
                as: 'category'
            }]
        });

        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: updatedItem
        });
    } catch (error) {
        console.error('Error in updateMenuItem:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        await menuItem.destroy();

        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteMenuItem:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


const uploadImage = async (req, res) => {
    try {
        console.log('========== UPLOAD REQUEST RECEIVED ==========');
        console.log('File:', req.file);
        
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Cloudinary returns the file info including secure URL
        console.log('File uploaded to Cloudinary:');
        console.log('- Filename:', req.file.filename);
        console.log('- Original name:', req.file.originalname);
        console.log('- Size:', req.file.size);
        console.log('- Cloudinary URL:', req.file.path); 

        // Return the Cloudinary URL
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl: req.file.path, // Cloudinary secure URL
                filename: req.file.filename,
                public_id: req.file.filename
            }
        });

    } catch (error) {
        console.error('UPLOAD ERROR');
        console.error('Error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
};


const healthCheck = (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
};

// Export ALL functions
module.exports = {
    getMenuItems,
    getMenuItemById,
    getMenuItemsByCategory,  
    getCategories,            
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadImage,
    healthCheck
};