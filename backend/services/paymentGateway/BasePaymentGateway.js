class BasePaymentGateway {
    constructor(config) {
        this.config = config;
        this.gatewayName = 'base';
    }

    /**
     * Create a payment intent/order
     * @param {Object} paymentData - Payment information
     * @param {number} paymentData.amount - Amount in smallest currency unit
     * @param {string} paymentData.currency - Currency code
     * @param {string} paymentData.description - Payment description
     * @param {Object} paymentData.metadata - Additional metadata
     * @param {Object} paymentData.customer - Customer information
     * @returns {Promise<Object>} Payment intent/order object
     */
    async createPaymentIntent(paymentData) {
        throw new Error('createPaymentIntent method must be implemented');
    }

    /**
     * Verify payment status
     * @param {string} paymentId - Payment ID from gateway
     * @returns {Promise<Object>} Payment verification result
     */
    async verifyPayment(paymentId) {
        throw new Error('verifyPayment method must be implemented');
    }

    /**
     * Capture payment (for two-step payments)
     * @param {string} paymentId - Payment ID to capture
     * @param {number} amount - Amount to capture (optional)
     * @returns {Promise<Object>} Capture result
     */
    async capturePayment(paymentId, amount = null) {
        throw new Error('capturePayment method must be implemented');
    }

    /**
     * Refund payment
     * @param {string} paymentId - Payment ID to refund
     * @param {number} amount - Amount to refund (optional, full refund if not specified)
     * @param {string} reason - Refund reason
     * @returns {Promise<Object>} Refund result
     */
    async refundPayment(paymentId, amount = null, reason = '') {
        throw new Error('refundPayment method must be implemented');
    }

    /**
     * Get payment details
     * @param {string} paymentId - Payment ID
     * @returns {Promise<Object>} Payment details
     */
    async getPaymentDetails(paymentId) {
        throw new Error('getPaymentDetails method must be implemented');
    }

    /**
     * Create customer profile
     * @param {Object} customerData - Customer information
     * @returns {Promise<Object>} Customer profile
     */
    async createCustomer(customerData) {
        throw new Error('createCustomer method must be implemented');
    }

    /**
     * Validate webhook signature
     * @param {string} payload - Webhook payload
     * @param {string} signature - Webhook signature
     * @param {string} secret - Webhook secret
     * @returns {boolean} Validation result
     */
    validateWebhookSignature(payload, signature, secret) {
        throw new Error('validateWebhookSignature method must be implemented');
    }

    /**
     * Parse webhook event
     * @param {Object} payload - Webhook payload
     * @returns {Object} Parsed event data
     */
    parseWebhookEvent(payload) {
        throw new Error('parseWebhookEvent method must be implemented');
    }

    /**
     * Format amount for gateway (convert to smallest currency unit)
     * @param {number} amount - Amount in major currency unit
     * @param {string} currency - Currency code
     * @returns {number} Amount in smallest currency unit
     */
    formatAmount(amount, currency = 'USD') {
        // Most currencies use 2 decimal places
        const decimalPlaces = this.getCurrencyDecimalPlaces(currency);
        return Math.round(amount * Math.pow(10, decimalPlaces));
    }

    /**
     * Parse amount from gateway (convert from smallest currency unit)
     * @param {number} amount - Amount in smallest currency unit
     * @param {string} currency - Currency code
     * @returns {number} Amount in major currency unit
     */
    parseAmount(amount, currency = 'USD') {
        const decimalPlaces = this.getCurrencyDecimalPlaces(currency);
        return amount / Math.pow(10, decimalPlaces);
    }

    /**
     * Get decimal places for currency
     * @param {string} currency - Currency code
     * @returns {number} Number of decimal places
     */
    getCurrencyDecimalPlaces(currency) {
        const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP'];
        return zeroDecimalCurrencies.includes(currency.toUpperCase()) ? 0 : 2;
    }

    /**
     * Standardize payment status across gateways
     * @param {string} gatewayStatus - Gateway-specific status
     * @returns {string} Standardized status
     */
    standardizePaymentStatus(gatewayStatus) {
        const statusMap = {
            // Common statuses
            'succeeded': 'completed',
            'success': 'completed',
            'completed': 'completed',
            'paid': 'completed',
            'captured': 'completed',
            
            'pending': 'pending',
            'processing': 'processing',
            'requires_action': 'pending',
            'requires_confirmation': 'pending',
            
            'failed': 'failed',
            'declined': 'failed',
            'canceled': 'cancelled',
            'cancelled': 'cancelled',
            
            'refunded': 'refunded',
            'partially_refunded': 'partially_refunded'
        };

        return statusMap[gatewayStatus.toLowerCase()] || 'pending';
    }

    /**
     * Generate unique idempotency key
     * @param {string} prefix - Key prefix
     * @returns {string} Unique key
     */
    generateIdempotencyKey(prefix = 'pay') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Validate required configuration
     * @param {Array} requiredFields - Required configuration fields
     * @throws {Error} If required fields are missing
     */
    validateConfig(requiredFields) {
        const missingFields = requiredFields.filter(field => !this.config[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
        }
    }

    /**
     * Handle gateway errors
     * @param {Error} error - Gateway error
     * @returns {Object} Standardized error object
     */
    handleGatewayError(error) {
        return {
            success: false,
            error: {
                code: error.code || 'GATEWAY_ERROR',
                message: error.message || 'Payment gateway error',
                type: error.type || 'gateway_error',
                details: error.details || null
            }
        };
    }

    /**
     * Log gateway interaction
     * @param {string} action - Action performed
     * @param {Object} data - Action data
     * @param {Object} result - Action result
     */
    logInteraction(action, data, result) {
        console.log(`[${this.gatewayName.toUpperCase()}] ${action}:`, {
            timestamp: new Date().toISOString(),
            action,
            data: this.sanitizeLogData(data),
            result: this.sanitizeLogData(result)
        });
    }

    /**
     * Sanitize sensitive data for logging
     * @param {Object} data - Data to sanitize
     * @returns {Object} Sanitized data
     */
    sanitizeLogData(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sensitiveFields = ['card', 'cvv', 'password', 'secret', 'key', 'token'];
        const sanitized = { ...data };
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
}

module.exports = BasePaymentGateway;