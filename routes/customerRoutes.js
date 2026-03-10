const express = require('express');
const router = express.Router();
const { verifyCustomerToken } = require('../middleware/auth');
const db = require('../models');

const Customer = db.Customer;
const CustomerAddress = db.CustomerAddress;
const Order = db.Order;
const OrderItem = db.OrderItem;

// Get customer profile
router.get('/profile', verifyCustomerToken, async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.customerId, {
            attributes: ['id', 'name', 'mobile']
        });
        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update customer profile
router.put('/profile', verifyCustomerToken, async (req, res) => {
    try {
        const { name } = req.body;
        await Customer.update({ name }, { where: { id: req.customerId } });
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all addresses
router.get('/addresses', verifyCustomerToken, async (req, res) => {
    try {
        console.log('Fetching addresses for customer:', req.customerId);
        
        const addresses = await CustomerAddress.findAll({
            where: { customer_id: req.customerId },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
        });
        
        console.log(`Found ${addresses.length} addresses`);
        res.json({ success: true, data: addresses });
    } catch (error) {
        console.error('Addresses error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add address
router.post('/address', verifyCustomerToken, async (req, res) => {
    try {
        console.log('Adding address for customer:', req.customerId);
        console.log('Address data received:', req.body);

        const {
            address_type,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            is_default
        } = req.body;

        // Validate required fields
        if (!address_line1 || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: 'Address line 1, city, state, and pincode are required'
            });
        }

        // If this address is set as default, unset other defaults
        if (is_default) {
            await CustomerAddress.update(
                { is_default: false },
                { where: { customer_id: req.customerId } }
            );
        }

        // Create new address
        const newAddress = await CustomerAddress.create({
            customer_id: req.customerId,
            address_type: address_type || 'home',
            address_line1,
            address_line2: address_line2 || '',
            city,
            state,
            pincode,
            is_default: is_default || false
        });

        console.log('Address created with ID:', newAddress.id);

        res.json({
            success: true,
            message: 'Address added successfully',
            data: newAddress
        });

    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add address',
            error: error.message
        });
    }
});

// Update address
router.put('/address/:id', verifyCustomerToken, async (req, res) => {
    try {
        console.log('Updating address:', req.params.id, 'for customer:', req.customerId);

        const address = await CustomerAddress.findOne({
            where: {
                id: req.params.id,
                customer_id: req.customerId
            }
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        const {
            address_type,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            is_default
        } = req.body;

        // If this address is set as default, unset other defaults
        if (is_default) {
            await CustomerAddress.update(
                { is_default: false },
                { where: { customer_id: req.customerId } }
            );
        }

        await address.update({
            address_type: address_type || address.address_type,
            address_line1: address_line1 || address.address_line1,
            address_line2: address_line2 !== undefined ? address_line2 : address.address_line2,
            city: city || address.city,
            state: state || address.state,
            pincode: pincode || address.pincode,
            is_default: is_default !== undefined ? is_default : address.is_default
        });

        console.log('Address updated successfully');

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: address
        });

    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address',
            error: error.message
        });
    }
});

// Delete address
router.delete('/address/:id', verifyCustomerToken, async (req, res) => {
    try {
        console.log('Deleting address:', req.params.id, 'for customer:', req.customerId);

        const deleted = await CustomerAddress.destroy({
            where: {
                id: req.params.id,
                customer_id: req.customerId
            }
        });

        if (deleted) {
            console.log('Address deleted successfully');
            res.json({
                success: true,
                message: 'Address deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
            error: error.message
        });
    }
});

// Set default address
router.put('/address/:id/default', verifyCustomerToken, async (req, res) => {
    try {
        console.log('Setting default address:', req.params.id, 'for customer:', req.customerId);

        // First unset all defaults
        await CustomerAddress.update(
            { is_default: false },
            { where: { customer_id: req.customerId } }
        );

        // Then set the selected one as default
        const [updated] = await CustomerAddress.update(
            { is_default: true },
            {
                where: {
                    id: req.params.id,
                    customer_id: req.customerId
                }
            }
        );

        if (updated) {
            console.log('Default address set successfully');
            res.json({
                success: true,
                message: 'Default address set successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

    } catch (error) {
        console.error('Set default error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set default address',
            error: error.message
        });
    }
});

// Get orders
router.get('/orders', verifyCustomerToken, async (req, res) => {
    try {
        console.log('Fetching orders for customer:', req.customerId);

        const orders = await Order.findAll({
            where: { customer_id: req.customerId },
            include: [{
                model: OrderItem,
                as: 'items'
            }],
            order: [['created_at', 'DESC']]
        });

        console.log(`Found ${orders.length} orders`);
        res.json({ success: true, data: orders });

    } catch (error) {
        console.error('Orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

module.exports = router;