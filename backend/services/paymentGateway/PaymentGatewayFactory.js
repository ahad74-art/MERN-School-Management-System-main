const StripeGateway = require('./StripeGateway');
const RazorpayGateway = require('./RazorpayGateway');

class PaymentGatewayFactory {
    static create(gatewayType, config = {}) {
        switch (gatewayType.toLowerCase()) {
            case 'stripe':
                return new StripeGateway(config);
            case 'razorpay':
                return new RazorpayGateway(config);
            default:
                throw new Error(`Unsupported payment gateway: ${gatewayType}`);
        }
    }

    static getSupportedGateways() {
        return ['stripe', 'razorpay'];
    }
}

module.exports = PaymentGatewayFactory;