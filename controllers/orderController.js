const db = require('../models');
const { sendCustomerOrderEmail, sendAdminNotification } = require('../config/resend');
const { validationResult } = require('express-validator');
const sequelize = require('sequelize');


const Order = db.Order;
const OrderItem = db.OrderItem;
const MenuItem = db.MenuItem;


const createOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      customer_id,  
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      items,
      subtotal,
      delivery_fee,
      total,
      payment_method,
      payment_status,
      special_instructions,
      delivery_date,
      delivery_time
    } = req.body;

    console.log('Creating order for customer_id:', customer_id);

    // Calculate totals 
    const calcSubtotal = subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calcDeliveryFee = delivery_fee || (calcSubtotal > 499 ? 0 : 40);
    const calcTotal = total || calcSubtotal + calcDeliveryFee;

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const order_number = `ORD${year}${month}${day}${random}`;

    // Create order
    const order = await Order.create({
      order_number,
      customer_id: customer_id || null, 
      customer_name,
      customer_phone,
      customer_address,
      subtotal: calcSubtotal,
      delivery_fee: calcDeliveryFee,
      total: calcTotal,
      payment_method: String(payment_method),
      payment_status: payment_status || 'pending',
      order_status: 'pending',
      special_instructions,
      delivery_date,
      delivery_time,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    console.log('Order created with ID:', order.id, 'for customer:', customer_id);

    // Create order items
    for (const item of items) {
      await OrderItem.create({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }, { transaction });
    }

    await transaction.commit();

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });

    console.log('Order completed successfully');

 
    if (customer_email) {
      try {
        // Add your email sending logic here
        console.log('Email would be sent to:', customer_email);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: completeOrder
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in createOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


const getOrders = async (req, res) => {
  try {
    const { status, date } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    if (status) {
      whereClause.order_status = status;
    }
    
    if (date) {
      whereClause.created_at = {
        [sequelize.Op.gte]: new Date(date),
        [sequelize.Op.lt]: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [{
        model: OrderItem,
        as: 'items'
      }],
      order: [['created_at', 'DESC']],
      attributes: { include: ['created_at', 'updated_at'] }
    });

    console.log('Orders fetched:', orders.length);

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderItem,
        as: 'items'
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ order_status: status });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};