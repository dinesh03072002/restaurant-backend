const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function for date formatting
const formatOrderDate = (dateString) => {
    const options = {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    if (!dateString) return new Date().toLocaleString('en-IN', options);
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) 
            ? new Date().toLocaleString('en-IN', options)
            : date.toLocaleString('en-IN', options);
    } catch {
        return new Date().toLocaleString('en-IN', options);
    }
};

// Send order confirmation to customer
const sendCustomerOrderEmail = async (order, customerEmail) => {
    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="text-align: center; background: #fc8019; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">ABC Restaurant</h1>
                    <p style="margin: 5px 0 0;">Order Confirmation</p>
                </div>
                
                <div style="padding: 20px;">
                    <h2 style="color: #333; margin-top: 0;">Thank you for your order!</h2>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #fc8019;">Order Details</h3>
                        <p><strong>Order Number:</strong> ${order.order_number}</p>
                        <p><strong>Order Date:</strong> ${formatOrderDate(order.created_at)}</p>
                        <p><strong>Payment Method:</strong> ${order.payment_method === 'demo' ? 'Online' : 'Cash on Delivery'}</p>
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
                            ${order.items?.map(item => `
                                <tr style="border-bottom: 1px solid #e0e0e0;">
                                    <td style="padding: 10px;">${item.item_name}</td>
                                    <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                                    <td style="padding: 10px; text-align: right;">₹${item.subtotal}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>

                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #fc8019;">Delivery Address</h3>
                        <p><strong>Name:</strong> ${order.customer_name}</p>
                        <p><strong>Phone:</strong> ${order.customer_phone}</p>
                        <p><strong>Address:</strong> ${order.customer_address}</p>
                    </div>
                </div>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: 'ABC Restaurant <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `Order Confirmation - #${order.order_number}`,
            html: htmlContent
        });

        if (error) throw error;
        console.log(`Customer email sent to ${customerEmail}`);
        return data;
    } catch (error) {
        console.error('Customer email failed:', error);
        throw error;
    }
};

// Send admin notification
const sendAdminNotification = async (order) => {
    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #fc8019;">New Order Alert!</h2>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Order Number:</strong> ${order.order_number}</p>
                    <p><strong>Order Date:</strong> ${formatOrderDate(order.created_at)}</p>
                    <p><strong>Customer:</strong> ${order.customer_name}</p>
                    <p><strong>Phone:</strong> ${order.customer_phone}</p>
                    <p><strong>Address:</strong> ${order.customer_address}</p>
                    <p><strong>Total:</strong> ₹${order.total}</p>
                    <p><strong>Payment:</strong> ${order.payment_method}</p>
                </div>

                <h3>Items:</h3>
                <ul>
                    ${order.items?.map(item => `
                        <li>${item.item_name} x${item.quantity} = ₹${item.subtotal}</li>
                    `).join('') || ''}
                </ul>

                <p style="margin-top: 20px;">
                    <a href="${process.env.ADMIN_URL}/dashboard" style="background: #fc8019; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a>
                </p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: 'ABC Restaurant System <onboarding@resend.dev>',
            to: [process.env.ADMIN_EMAIL],
            subject: `New Order - #${order.order_number}`,
            html: htmlContent
        });

        if (error) throw error;
        console.log('Admin notification sent');
        return data;
    } catch (error) {
        console.error('Admin notification failed:', error);
        throw error;
    }
};

module.exports = {
    sendCustomerOrderEmail,
    sendAdminNotification
};