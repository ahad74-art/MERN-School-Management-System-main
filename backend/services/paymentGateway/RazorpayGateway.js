const BasePaymentGateway = require('./BasePaymentGateway');
const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayGateway extends BasePaymentGateway {
    constructor(config) {
        super(config);
        this.gatewayName = 'razorpay';
        this.validateConfig(['keyId', 'keySecret']);
        this.razorpay = new Razorpay({
            key_id: config.keyId,
            key_secret: config.keySecret
        });
    }

    async createPaymentIntent(paymentData) {
        try {
            const {
                amount,
                currency = 'INR',
                description,
                metadata = {},
                customer
            } = paymentData;

            const orderData = {
                amount: this.formatAmount(amount, currency),
                currency: currency.toUpperCase(),
                receipt: `receipt_${Date.now()}`,
                notes: {
                    ...metadata,
                    gateway: 'razorpay',
                    description
                }
            };

            const order = await this.razorpay.orders.create(orderData);

            return {
                success: true,
                paymentIntent: {
                    id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    status: order.status,
                    gatewayResponse: order
                }
            };

        } catch (error) {
            console.error('Razorpay payment intent creation failed:', error);
            return {
                success: false,
                error: {
                    message: error.error?.description || error.message,
                    code: error.error?.code || 'RAZORPAY_ERROR'
                }
            };
        }
    }

    async verifyPayment(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            
            return {
                success: true,
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: this.mapRazorpayStatus(payment.status),
                    paymentMethod: {
                        type: payment.method
                    },
                    gatewayResponse: payment
                }
            };

        } catch (error) {
            console.error('Razorpay payment verification failed:', error);
            return {
                success: false,
                error: {
                    message: error.error?.description || error.message,
                    code: error.error?.code || 'VERIFICATION_FAILED'
                }
            };
        }
    }

    async capturePayment(paymentId, amount = null) {
        try {
            const captureData = {};
            if (amount) {
                captureData.amount = amount;
            }

            const payment = await this.razorpay.payments.capture(paymentId, captureData);

            return {
                success: true,
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    status: this.mapRazorpayStatus(payment.status),
                    gatewayResponse: payment
                }
            };

        } catch (error) {
            console.error('Razorpay payment capture failed:', error);
            return {
                success: false,
                error: {
                    message: error.error?.description || error.message,
                    code: error.error?.code || 'CAPTURE_FAILED'
                }
            };
        }
    }

    async refundPayment(paymentId, amount = null, reason = '') {
        try {
            const refundData = {
                notes: {
                    reason: reason || 'Refund requested'
                }
            };

            if (amount) {
                refundData.amount = amount;
            }

            const refund = await this.razorpay.payments.refund(paymentId, refundData);

            return {
                success: true,
                refund: {
                    id: refund.id,
                    amount: refund.amount,
                    status: refund.status,
                    gatewayResponse: refund
                }
            };

        } catch (error) {
            console.error('Razorpay refund failed:', error);
            return {
                success: false,
                error: {
                    message: error.error?.description || error.message,
                    code: error.error?.code || 'REFUND_FAILED'
                }
            };
        }
    }

    async createCustomer(customerData) {
        try {
            const { name, email, phone } = customerData;
            
            const customer = await this.razorpay.customers.create({
                name,
                email,
                contact: phone,
                notes: {
                    created_by: 'school_management_system'
                }
            });

            return {
                success: true,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.contact
                }
            };

        } catch (error) {
            console.error('Razorpay customer creation failed:', error);
            return {
                success: false,
                error: {
                    message: error.error?.description || error.message,
                    code: error.error?.code || 'CUSTOMER_CREATION_FAILED'
                }
            };
        }
    }

    validateWebhookSignature(payload, signature, secret) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            return {
                success: expectedSignature === signature,
                message: expectedSignature === signature ? 'Valid signature' : 'Invalid signature'
            };

        } catch (error) {
            return {
                success: false,
                message: 'Signature validation failed',
                error: error.message
            };
        }
    }

    parseWebhookEvent(payload) {
        return {
            type: payload.event,
            data: payload.payload
        };
    }

    formatAmount(amount, currency) {
        // Razorpay expects amount in smallest currency unit (paise for INR)
        if (currency.toUpperCase() === 'INR') {
            return Math.round(amount * 100);
        }
        return Math.round(amount * 100); // Default to cents/paise
    }

    mapRazorpayStatus(razorpayStatus) {
        const statusMap = {
            'created': 'pending',
            'authorized': 'processing',
            'captured': 'completed',
            'refunded': 'refunded',
            'failed': 'failed'
        };

        return statusMap[razorpayStatus] || 'pending';
    }

    validateConfig(requiredFields) {
        const missingFields = requiredFields.filter(field => !this.config[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required Razorpay configuration: ${missingFields.join(', ')}`);
        }
    }
}

module.exports = RazorpayGateway;