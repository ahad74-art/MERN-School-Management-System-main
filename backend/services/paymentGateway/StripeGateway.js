const BasePaymentGateway = require('./BasePaymentGateway');
const stripe = require('stripe');

class StripeGateway extends BasePaymentGateway {
    constructor(config) {
        super(config);
        this.gatewayName = 'stripe';
        this.validateConfig(['secretKey']);
        this.stripe = stripe(config.secretKey);
    }

    async createPaymentIntent(paymentData) {
        try {
            const {
                amount,
                currency = 'usd',
                description,
                metadata = {},
                customer,
                paymentMethods = ['card'],
                captureMethod = 'automatic'
            } = paymentData;

            const intentData = {
                amount: this.formatAmount(amount, currency),
                currency: currency.toLowerCase(),
                description,
                metadata: {
                    ...metadata,
                    gateway: 'stripe'
                },
                payment_method_types: paymentMethods,
                capture_method: captureMethod,
                confirmation_method: 'manual',
                confirm: false
            };

            // Add customer if provided
            if (customer) {
                if (customer.id) {
                    intentData.customer = customer.id;
                } else {
                    // Create customer if not exists
                    const stripeCustomer = await this.createCustomer(customer);
                    intentData.customer = stripeCustomer.id;
                }
            }

            const paymentIntent = await this.stripe.paymentIntents.create(intentData);

            this.logInteraction('createPaymentIntent', paymentData, paymentIntent);

            return {
                success: true,
                paymentIntent: {
                    id: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret,
                    status: this.standardizePaymentStatus(paymentIntent.status),
                    amount: this.parseAmount(paymentIntent.amount, currency),
                    currency: paymentIntent.currency,
                    gatewayResponse: paymentIntent
                }
            };
        } catch (error) {
            this.logInteraction('createPaymentIntent', paymentData, error);
            return this.handleGatewayError(error);
        }
    }

    async verifyPayment(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            this.logInteraction('verifyPayment', { paymentIntentId }, paymentIntent);

            return {
                success: true,
                payment: {
                    id: paymentIntent.id,
                    status: this.standardizePaymentStatus(paymentIntent.status),
                    amount: this.parseAmount(paymentIntent.amount, paymentIntent.currency),
                    currency: paymentIntent.currency,
                    paymentMethod: paymentIntent.payment_method,
                    created: new Date(paymentIntent.created * 1000),
                    gatewayResponse: paymentIntent
                }
            };
        } catch (error) {
            this.logInteraction('verifyPayment', { paymentIntentId }, error);
            return this.handleGatewayError(error);
        }
    }

    async capturePayment(paymentIntentId, amount = null) {
        try {
            const captureData = {};
            if (amount !== null) {
                captureData.amount_to_capture = this.formatAmount(amount);
            }

            const paymentIntent = await this.stripe.paymentIntents.capture(
                paymentIntentId,
                captureData
            );

            this.logInteraction('capturePayment', { paymentIntentId, amount }, paymentIntent);

            return {
                success: true,
                payment: {
                    id: paymentIntent.id,
                    status: this.standardizePaymentStatus(paymentIntent.status),
                    amount: this.parseAmount(paymentIntent.amount, paymentIntent.currency),
                    currency: paymentIntent.currency,
                    gatewayResponse: paymentIntent
                }
            };
        } catch (error) {
            this.logInteraction('capturePayment', { paymentIntentId, amount }, error);
            return this.handleGatewayError(error);
        }
    }

    async refundPayment(paymentIntentId, amount = null, reason = '') {
        try {
            const refundData = {
                payment_intent: paymentIntentId,
                reason: reason || 'requested_by_customer'
            };

            if (amount !== null) {
                refundData.amount = this.formatAmount(amount);
            }

            const refund = await this.stripe.refunds.create(refundData);

            this.logInteraction('refundPayment', { paymentIntentId, amount, reason }, refund);

            return {
                success: true,
                refund: {
                    id: refund.id,
                    status: this.standardizePaymentStatus(refund.status),
                    amount: this.parseAmount(refund.amount, refund.currency),
                    currency: refund.currency,
                    reason: refund.reason,
                    created: new Date(refund.created * 1000),
                    gatewayResponse: refund
                }
            };
        } catch (error) {
            this.logInteraction('refundPayment', { paymentIntentId, amount, reason }, error);
            return this.handleGatewayError(error);
        }
    }

    async getPaymentDetails(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
                expand: ['payment_method', 'charges.data.balance_transaction']
            });

            this.logInteraction('getPaymentDetails', { paymentIntentId }, paymentIntent);

            return {
                success: true,
                payment: {
                    id: paymentIntent.id,
                    status: this.standardizePaymentStatus(paymentIntent.status),
                    amount: this.parseAmount(paymentIntent.amount, paymentIntent.currency),
                    currency: paymentIntent.currency,
                    paymentMethod: paymentIntent.payment_method,
                    charges: paymentIntent.charges.data,
                    created: new Date(paymentIntent.created * 1000),
                    gatewayResponse: paymentIntent
                }
            };
        } catch (error) {
            this.logInteraction('getPaymentDetails', { paymentIntentId }, error);
            return this.handleGatewayError(error);
        }
    }

    async createCustomer(customerData) {
        try {
            const {
                email,
                name,
                phone,
                address,
                metadata = {}
            } = customerData;

            const customer = await this.stripe.customers.create({
                email,
                name,
                phone,
                address,
                metadata: {
                    ...metadata,
                    gateway: 'stripe'
                }
            });

            this.logInteraction('createCustomer', customerData, customer);

            return {
                success: true,
                customer: {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    phone: customer.phone,
                    created: new Date(customer.created * 1000),
                    gatewayResponse: customer
                }
            };
        } catch (error) {
            this.logInteraction('createCustomer', customerData, error);
            return this.handleGatewayError(error);
        }
    }

    validateWebhookSignature(payload, signature, secret) {
        try {
            const event = this.stripe.webhooks.constructEvent(payload, signature, secret);
            return { success: true, event };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    parseWebhookEvent(payload) {
        try {
            const event = JSON.parse(payload);
            
            return {
                id: event.id,
                type: event.type,
                data: event.data,
                created: new Date(event.created * 1000),
                livemode: event.livemode
            };
        } catch (error) {
            throw new Error('Invalid webhook payload');
        }
    }

    // Stripe-specific methods

    async confirmPaymentIntent(paymentIntentId, paymentMethodId = null) {
        try {
            const confirmData = {};
            if (paymentMethodId) {
                confirmData.payment_method = paymentMethodId;
            }

            const paymentIntent = await this.stripe.paymentIntents.confirm(
                paymentIntentId,
                confirmData
            );

            this.logInteraction('confirmPaymentIntent', { paymentIntentId, paymentMethodId }, paymentIntent);

            return {
                success: true,
                paymentIntent: {
                    id: paymentIntent.id,
                    status: this.standardizePaymentStatus(paymentIntent.status),
                    clientSecret: paymentIntent.client_secret,
                    gatewayResponse: paymentIntent
                }
            };
        } catch (error) {
            this.logInteraction('confirmPaymentIntent', { paymentIntentId, paymentMethodId }, error);
            return this.handleGatewayError(error);
        }
    }

    async createSetupIntent(customerId, paymentMethodTypes = ['card']) {
        try {
            const setupIntent = await this.stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: paymentMethodTypes,
                usage: 'off_session'
            });

            this.logInteraction('createSetupIntent', { customerId, paymentMethodTypes }, setupIntent);

            return {
                success: true,
                setupIntent: {
                    id: setupIntent.id,
                    clientSecret: setupIntent.client_secret,
                    status: setupIntent.status,
                    gatewayResponse: setupIntent
                }
            };
        } catch (error) {
            this.logInteraction('createSetupIntent', { customerId, paymentMethodTypes }, error);
            return this.handleGatewayError(error);
        }
    }

    standardizePaymentStatus(stripeStatus) {
        const statusMap = {
            'requires_payment_method': 'pending',
            'requires_confirmation': 'pending',
            'requires_action': 'pending',
            'processing': 'processing',
            'requires_capture': 'pending',
            'canceled': 'cancelled',
            'succeeded': 'completed'
        };

        return statusMap[stripeStatus] || super.standardizePaymentStatus(stripeStatus);
    }
}

module.exports = StripeGateway;