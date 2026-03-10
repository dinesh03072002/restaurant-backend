const db = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const Customer = db.Customer;

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

        console.log(`🔐 OTP for ${mobile}: ${otp}`);

        // Find or create customer
        let customer = await Customer.findOne({ where: { mobile } });
        
        if (!customer) {
            customer = await Customer.create({
                mobile,
                name: `User${mobile.slice(-4)}`
            });
        }

        // Save OTP to database
        await customer.update({
            otp: otp,
            otp_expiry: expiry
        });

        // TODO: Integrate Fast2SMS here later
        console.log(`📱 SMS would be sent to ${mobile} with OTP: ${otp}`);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
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

        // Find customer with matching OTP (not expired)
        const customer = await Customer.findOne({
            where: {
                mobile,
                otp: otp,
                otp_expiry: { [Op.gt]: new Date() }
            }
        });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Clear OTP after successful verification
        await customer.update({
            otp: null,
            otp_expiry: null
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: customer.id, 
                mobile: customer.mobile 
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
                    mobile: customer.mobile
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

        // Find customer
        const customer = await Customer.findOne({ where: { mobile } });
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Mobile number not registered'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60000);

        // Update OTP in database
        await customer.update({
            otp: otp,
            otp_expiry: expiry
        });

        console.log(`🔄 Resent OTP for ${mobile}: ${otp}`);

        res.json({
            success: true,
            message: 'OTP resent successfully',
            debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
        });

    } catch (error) {
        console.error('❌ OTP resend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP'
        });
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    resendOTP
};