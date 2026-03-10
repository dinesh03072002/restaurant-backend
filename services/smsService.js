const axios = require('axios');

class SMSService {
    constructor() {
        this.apiKey = process.env.FAST2SMS_API_KEY;
        this.baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
    }

    /**
     * Send OTP via Fast2SMS
     * @param {string} mobile - 10-digit mobile number
     * @param {string} otp - 6-digit OTP
     * @returns {Promise<object>}
     */
    async sendOTP(mobile, otp) {
        try {
            // Validate Indian mobile number
            if (!this.validateIndianMobile(mobile)) {
                throw new Error('Invalid Indian mobile number');
            }

            console.log(`📱 Sending OTP ${otp} to ${mobile}`);

            // For development, just log (no actual SMS sent)
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ DEV MODE - OTP:', otp);
                return { 
                    success: true, 
                    debug: true,
                    message: 'OTP would be sent in production',
                    otp: otp // Only in development!
                };
            }

            // For production - send actual SMS
            const response = await axios.get(this.baseUrl, {
                params: {
                    authorization: this.apiKey,
                    variables_values: otp,
                    route: 'otp', // OTP route is specifically for OTP messages
                    numbers: mobile
                }
            });

            console.log('✅ SMS sent:', response.data);
            
            if (response.data.return === true) {
                return {
                    success: true,
                    message: 'OTP sent successfully',
                    requestId: response.data.request_id
                };
            } else {
                throw new Error(response.data.message || 'Failed to send OTP');
            }

        } catch (error) {
            console.error('❌ SMS sending failed:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || error.message);
        }
    }

    /**
     * Send custom message (for future use)
     * @param {string} mobile - 10-digit mobile number
     * @param {string} message - Message text
     * @returns {Promise<object>}
     */
    async sendMessage(mobile, message) {
        try {
            if (!this.validateIndianMobile(mobile)) {
                throw new Error('Invalid Indian mobile number');
            }

            const response = await axios.get(this.baseUrl, {
                params: {
                    authorization: this.apiKey,
                    message: message,
                    language: 'english',
                    route: 'q', // Quick SMS route
                    numbers: mobile
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ SMS sending failed:', error);
            throw error;
        }
    }

    /**
     * Validate Indian mobile number
     * @param {string} mobile 
     * @returns {boolean}
     */
    validateIndianMobile(mobile) {
        // Indian mobile numbers: 10 digits, starting with 6-9
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(mobile);
    }
}

module.exports = new SMSService();