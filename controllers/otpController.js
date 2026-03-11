
const db = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const axios = require('axios'); 

const Customer = db.Customer;

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS via Fast2SMS
const sendSMSViaFast2SMS = async (mobile, otp) => {
    try {
        console.log(`Sending OTP ${otp} to ${mobile} via Fast2SMS Quick Route...`);
        console.log(`Your balance: ₹50 - This will cost ₹5 per SMS`);
        
        // Quick SMS Route - Works without KYC!
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: process.env.FAST2SMS_API_KEY,
                route: 'q', // 'q' for Quick SMS route - NO KYC NEEDED
                message: `Your OTP is ${otp}. Valid for 5 minutes.`,
                language: 'english',
                flash: 0,
                numbers: mobile, // Single number or comma-separated for multiple
                sender_id: 'FSTSMS' // Default sender ID for Quick route
            },
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000 // 15 second timeout
        });

        console.log('📬 Fast2SMS Response:', JSON.stringify(response.data, null, 2));

        // Check if successful
        if (response.data.return === true) {
            console.log(`SMS sent successfully to ${mobile} via Quick Route!`);
            console.log(`Request ID: ${response.data.request_id || 'N/A'}`);
            console.log(`Remaining balance: ₹${response.data.wallet_balance || 'Check dashboard'}`);
            return { success: true, data: response.data };
        } else {
            console.error('❌ Fast2SMS error:', response.data.message);
            return { success: false, error: response.data.message, data: response.data };
        }
    } catch (error) {
        console.error('❌ Fast2SMS API error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received from Fast2SMS');
        }
        return { success: false, error: error.message };
    }
};


const sendOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        // Validate mobile number
        if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Valid Indian mobile number required (10 digits starting with 6-9)'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60000); 

        console.log(`OTP generated for ${mobile}: ${otp}`);

        // Find or create customer
        let customer = await Customer.findOne({ where: { mobile } });
        
        if (!customer) {
            customer = await Customer.create({
                mobile,
                name: `User${mobile.slice(-4)}`,
                is_active: true
            });
            console.log(`New customer created: ${mobile}`);
        }

        // Save OTP to database
        await customer.update({
            otp: otp,
            otp_expiry: expiry
        });

        // ALWAYS send SMS via Quick Route (works with ₹50, no KYC)
        console.log('📤 Attempting to send SMS via Fast2SMS Quick Route...');
        const smsResult = await sendSMSViaFast2SMS(mobile, otp);
        
        if (smsResult.success) {
            console.log('SMS sent successfully via Quick Route!');
        } else {
            console.error('SMS failed:', smsResult.error);
            // Don't expose failure to user, just log it
        }

        // Always return success to client (don't expose SMS failures)
        res.json({
            success: true,
            message: 'OTP sent successfully',
            // Show OTP in development only for testing
            debug: process.env.NODE_ENV === 'development' ? { 
                otp,
                smsSent: smsResult.success,
                route: 'Quick SMS (₹5 per SMS)',
                balance: '₹50 available - 10 OTPs can be sent'
            } : undefined
        });

    } catch (error) {
        console.error('OTP send error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const verifyOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        console.log(`🔍 Verifying OTP for ${mobile}: ${otp}`);

        // Find customer with matching OTP 
        const customer = await Customer.findOne({
            where: {
                mobile,
                otp: otp,
                otp_expiry: { [Op.gt]: new Date() }
            }
        });

        if (!customer) {
            // Check if OTP exists but expired
            const expiredCustomer = await Customer.findOne({
                where: {
                    mobile,
                    otp: otp,
                    otp_expiry: { [Op.lte]: new Date() }
                }
            });

            if (expiredCustomer) {
                return res.status(401).json({
                    success: false,
                    message: 'OTP expired. Please request again.'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        console.log(`OTP verified successfully for ${mobile}`);

        // Clear OTP after successful verification
        await customer.update({
            otp: null,
            otp_expiry: null,
            last_login: new Date()
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: customer.id, 
                mobile: customer.mobile,
                name: customer.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    mobile: customer.mobile,
                    email: customer.email || '',
                    is_active: customer.is_active
                }
            }
        });

    } catch (error) {
        console.error('❌ OTP verify error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const resendOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        console.log(`🔄 Resending OTP for ${mobile}`);

        // Find customer
        const customer = await Customer.findOne({ where: { mobile } });
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Mobile number not registered. Please try sending OTP first.'
            });
        }

        // Check if last OTP was sent within last minute (rate limiting)
        if (customer.otp_expiry) {
            const timeSinceLastOTP = (Date.now() - new Date(customer.otp_expiry).getTime() + 5*60000);
            if (timeSinceLastOTP < 60000) { // Less than 1 minute
                const waitTime = Math.ceil((60000 - timeSinceLastOTP) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitTime} seconds before requesting again`
                });
            }
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60000);

        // Update OTP in database
        await customer.update({
            otp: otp,
            otp_expiry: expiry
        });

        // Send SMS via Fast2SMS Quick Route
        console.log('📤 Attempting to resend SMS via Fast2SMS Quick Route...');
        const smsResult = await sendSMSViaFast2SMS(mobile, otp);
        
        if (smsResult.success) {
            console.log('✅ SMS resent successfully!');
        } else {
            console.error('❌ SMS resend failed:', smsResult.error);
        }

        res.json({
            success: true,
            message: 'OTP resent successfully',
            debug: process.env.NODE_ENV === 'development' ? { 
                otp,
                smsSent: smsResult.success,
                route: 'Quick SMS (₹5 per SMS)'
            } : undefined
        });

    } catch (error) {
        console.error('❌ OTP resend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    resendOTP
};