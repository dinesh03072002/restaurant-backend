const nodemailer = require('nodemailer');

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email config error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Helper function to format date exactly like admin panel
const formatOrderDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace('am', 'am').replace('pm', 'pm'); // Ensures lowercase am/pm
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Not available';
    }
};

// Send order confirmation to customer
const sendCustomerOrderEmail = async (order, customerEmail) => {
    const mailOptions = {
        from: `"ABC Restaurant" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `🍽️ Order Confirmation - Order #${order.order_number}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="text-align: center; background: #fc8019; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">ABC Restaurant</h1>
                    <p style="margin: 5px 0 0;">Order Confirmation</p>
                </div>
                
                <div style="padding: 20px;">
                    <h2 style="color: #333; margin-top: 0;">Thank you for your order! 🎉</h2>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #fc8019;">Order Details</h3>
                        <p><strong>Order Number:</strong> ${order.order_number}</p>
                        <p><strong>Order Date:</strong> ${formatOrderDate(order.created_at)}</p>
                        <p><strong>Payment Method:</strong> ${order.payment_method === 'demo' ? 'Online (Demo)' : 'Cash on Delivery'}</p>
                        <p><strong>Payment Status:</strong> ${order.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}</p>
                    </div>

                    <h3 style="color: #fc8019;">Items Ordered</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="padding: 10px; text-align: left;">Item</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items ? order.items.map(item => `
                                <tr style="border-bottom: 1px solid #e0e0e0;">
                                    <td style="padding: 10px;">${item.item_name}</td>
                                    <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                                    <td style="padding: 10px; text-align: right;">₹${item.subtotal}</td>
                                </tr>
                            `).join('') : ''}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                                <td style="padding: 10px; text-align: right;">₹${order.subtotal}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Delivery Fee:</strong></td>
                                <td style="padding: 10px; text-align: right;">₹${order.delivery_fee}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                                <td style="padding: 10px; text-align: right;"><strong>₹${order.total}</strong></td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #fc8019;">Delivery Address</h3>
                        <p><strong>Name:</strong> ${order.customer_name}</p>
                        <p><strong>Phone:</strong> ${order.customer_phone}</p>
                        <p><strong>Address:</strong> ${order.customer_address}</p>
                        <p><strong>Estimated Delivery:</strong> 30-40 minutes</p>
                    </div>

                    <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                        Thank you for choosing ABC Restaurant!<br>
                        If you have any questions, please contact us.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 15px; background: #f5f5f5; border-radius: 0 0 10px 10px; font-size: 12px; color: #999;">
                    <p>ABC Restaurant | Bengaluru | contact@abcrestaurant.com</p>
                </div>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

// Send notification to admin
const sendAdminNotification = async (order) => {
    const mailOptions = {
        from: `"ABC Restaurant System" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `🔔 New Order Received - #${order.order_number}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #fc8019;">New Order Alert! 🛎️</h2>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> ${order.order_number}</p>
                    <p><strong>Order Date:</strong> ${formatOrderDate(order.created_at)}</p>
                    <p><strong>Customer:</strong> ${order.customer_name}</p>
                    <p><strong>Phone:</strong> ${order.customer_phone}</p>
                    <p><strong>Address:</strong> ${order.customer_address}</p>
                    <p><strong>Total Amount:</strong> ₹${order.total}</p>
                    <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                    <p><strong>Payment Status:</strong> ${order.payment_status}</p>
                </div>

                <h3>Order Items:</h3>
                <ul>
                    ${order.items ? order.items.map(item => `
                        <li>${item.item_name} x${item.quantity} = ₹${item.subtotal}</li>
                    `).join('') : ''}
                </ul>

                <p style="margin-top: 20px;">
                    <a href="${process.env.ADMIN_URL}/dashboard" style="background: #fc8019; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a>
                </p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = {
    sendCustomerOrderEmail,
    sendAdminNotification
};