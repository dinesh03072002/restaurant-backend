// controllers/otpController.js
const db = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const axios = require('axios'); // Make sure to install: npm install axios

const Customer = db.Customer;

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS via Fast2SMS
const sendSMSViaFast2SMS = async (mobile, otp) => {
    try {
        console.log(`📤 Sending OTP ${otp} to ${mobile} via Fast2SMS...`);
        
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: process.env.FAST2SMS_API_KEY,
                variables_values: otp,
                route: 'otp',
                numbers: mobile,
                flash: 0,
                DLT_TE_ID: process.env.FAST2SMS_DLT_TE_ID || '' // Optional: Add if you have DLT registration
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📬 Fast2SMS Response:', response.data);

        if (response.data.return === true) {
            console.log(`✅ SMS sent successfully to ${mobile}`);
            return { success: true, data: response.data };
        } else {
            console.error('❌ Fast2SMS error:', response.data.message);
            return { success: false, error: response.data.message };
        }
    } catch (error) {
        console.error('❌ Fast2SMS API error:', error.message);
        if (error.response) {
            console.error('Fast2SMS Error Details:', error.response.data);
        }
        return { success: false, error: error.message };
    }
};

// @desc    Send OTP to mobile
// @route   POST /api/otp/send
// @access  Public
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
        const expiry = new Date(Date.now() + 5 * 60000); // 5 minutes

        console.log(`🔐 OTP generated for ${mobile}: ${otp}`);

        // Find or create customer
        let customer = await Customer.findOne({ where: { mobile } });
        
        if (!customer) {
            customer = await Customer.create({
                mobile,
                name: `User${mobile.slice(-4)}`,
                is_active: true
            });
            console.log(`📝 New customer created: ${mobile}`);
        }

        // Save OTP to database
        await customer.update({
            otp: otp,
            otp_expiry: expiry
        });

        // Send SMS via Fast2SMS
        let smsResult = { success: false };
        
        if (process.env.NODE_ENV === 'production') {
            smsResult = await sendSMSViaFast2SMS(mobile, otp);
            
            if (!smsResult.success) {
                console.warn('⚠️ Fast2SMS delivery failed, but OTP saved for verification');
                // You might want to queue this for retry or use fallback SMS provider
            }
        } else {
            // Development: log to console
            console.log(`📱 DEV MODE - SMS would be sent to ${mobile} with OTP: ${otp}`);
            console.log(`🌐 Fast2SMS would be called in production`);
            smsResult.success = true; // Assume success in dev
        }

        // Always return success to client (don't expose SMS failures)
        res.json({
            success: true,
            message: 'OTP sent successfully',
            // Only show OTP in development for testing
            debug: process.env.NODE_ENV === 'development' ? { 
                otp,
                sms: smsResult.success ? 'SMS would be sent' : 'SMS would fail'
            } : undefined
        });

    } catch (error) {
        console.error('❌ OTP send error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Verify OTP and login
// @route   POST /api/otp/verify
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        console.log(`🔍 Verifying OTP for ${mobile}: ${otp}`);

        // Find customer with matching OTP (not expired)
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

        console.log(`✅ OTP verified successfully for ${mobile}`);

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

// @desc    Resend OTP
// @route   POST /api/otp/resend
// @access  Public
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

        // Send SMS via Fast2SMS
        let smsResult = { success: false };
        
        if (process.env.NODE_ENV === 'production') {
            smsResult = await sendSMSViaFast2SMS(mobile, otp);
            
            if (!smsResult.success) {
                console.warn('⚠️ Fast2SMS resend failed, but OTP saved for verification');
            }
        } else {
            console.log(`🔄 DEV MODE - Resent OTP for ${mobile}: ${otp}`);
            smsResult.success = true;
        }

        res.json({
            success: true,
            message: 'OTP resent successfully',
            debug: process.env.NODE_ENV === 'development' ? { 
                otp,
                sms: smsResult.success ? 'SMS would be sent' : 'SMS would fail'
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

// @desc    Verify OTP (alternative endpoint for testing)
// @route   POST /api/otp/check
// @access  Public (for testing only)
const checkOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        const customer = await Customer.findOne({
            where: {
                mobile,
                otp: otp,
                otp_expiry: { [Op.gt]: new Date() }
            }
        });

        if (customer) {
            res.json({ success: true, message: 'OTP is valid' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Check failed' });
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    resendOTP,
    checkOTP
};