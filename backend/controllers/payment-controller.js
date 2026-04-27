const Payment = require('../models/paymentSchema');
const StudentFee = require('../models/studentFeeSchema');
const FeeStructure = require('../models/feeStructureSchema');
const Student = require('../models/studentSchema');
const PaymentGatewayFactory = require('../services/paymentGateway/PaymentGatewayFactory');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ─── Stripe Checkout Session ──────────────────────────────────────────────────

const createCheckoutSession = async (req, res) => {
    try {
        const { studentId, feeStructureId, amount, currency = 'usd' } = req.body;

        if (!studentId || !feeStructureId || !amount) {
            return res.status(400).json({ success: false, message: 'studentId, feeStructureId and amount are required' });
        }

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const feeStructure = await FeeStructure.findById(feeStructureId);
        if (!feeStructure) return res.status(404).json({ success: false, message: 'Fee structure not found' });

        // Prevent duplicate pending sessions (within last 10 min)
        const existing = await Payment.findOne({
            student: studentId,
            feeStructure: feeStructureId,
            status: { $in: ['pending', 'processing'] },
            amount,
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
        });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A similar payment is already in progress', paymentId: existing.paymentId });
        }

        // Amount in smallest currency unit (cents for USD)
        const unitAmount = Math.round(amount * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: feeStructure.name,
                        description: `Fee payment for ${student.name} (Roll: ${student.rollNum})`,
                    },
                    unit_amount: unitAmount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/Student/fees/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/Student/fees/cancel`,
            customer_email: student.email || undefined,
            metadata: {
                studentId: studentId.toString(),
                feeStructureId: feeStructureId.toString(),
                schoolId: feeStructure.school.toString(),
                amount: amount.toString(),
                currency,
            },
        });

        // Save pending payment record
        const payment = new Payment({
            student: studentId,
            feeStructure: feeStructureId,
            school: feeStructure.school,
            amount,
            currency: currency.toUpperCase(),
            paymentType: 'full',
            paymentGateway: 'stripe',
            paymentMethod: 'card',
            status: 'pending',
            description: `Fee payment for ${feeStructure.name}`,
            gatewayPaymentId: session.id, // store session ID here
            gatewayResponse: { sessionId: session.id },
        });
        await payment.save();

        res.json({ success: true, sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Stripe Webhook ───────────────────────────────────────────────────────────

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutSessionCompleted(session);
                break;
            }
            case 'payment_intent.payment_failed': {
                const pi = event.data.object;
                await handlePaymentIntentFailed(pi);
                break;
            }
            default:
                console.log(`Unhandled Stripe event: ${event.type}`);
        }
        res.json({ received: true });
    } catch (err) {
        console.error('Webhook processing error:', err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

const handleCheckoutSessionCompleted = async (session) => {
    // Find payment by stripe session ID stored in gatewayPaymentId
    const payment = await Payment.findOne({ gatewayPaymentId: session.id });
    if (!payment) {
        console.error('Payment not found for session:', session.id);
        return;
    }
    if (payment.status === 'completed') return; // idempotent

    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.transactionId = session.payment_intent;
    payment.gatewayResponse = session;
    if (!payment.receiptNumber) payment.generateReceiptNumber();
    await payment.save();

    // Update student fee record
    const studentFee = await StudentFee.findOne({
        student: payment.student,
        feeStructure: payment.feeStructure,
    });
    if (studentFee) await studentFee.addPayment(payment._id, payment.amount);

    console.log(`✅ Payment completed: ${payment.paymentId} | Receipt: ${payment.receiptNumber}`);
};

const handlePaymentIntentFailed = async (paymentIntent) => {
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    if (!payment || payment.status === 'failed') return;

    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    payment.failureCode = paymentIntent.last_payment_error?.code;
    payment.gatewayResponse = paymentIntent;
    await payment.save();

    console.log(`❌ Payment failed: ${payment.paymentId}`);
};

// ─── Verify session after redirect (called from success page) ─────────────────

const verifyCheckoutSession = async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id) return res.status(400).json({ success: false, message: 'session_id required' });

        const session = await stripe.checkout.sessions.retrieve(session_id);
        const payment = await Payment.findOne({ gatewayPaymentId: session_id })
            .populate('feeStructure', 'name feeType')
            .populate('student', 'name rollNum');

        if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

        res.json({
            success: true,
            sessionStatus: session.payment_status,
            payment: {
                paymentId: payment.paymentId,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                receiptNumber: payment.receiptNumber,
                completedAt: payment.completedAt,
                feeStructure: payment.feeStructure,
                student: payment.student,
            },
        });
    } catch (error) {
        console.error('Error verifying session:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create payment intent
const createPaymentIntent = async (req, res) => {
    try {
        const {
            studentId,
            feeStructureId,
            amount,
            paymentType = 'full',
            installmentNumber,
            paymentGateway = 'stripe',
            currency = 'USD'
        } = req.body;

        // Validate student and fee structure
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const feeStructure = await FeeStructure.findById(feeStructureId);
        if (!feeStructure) {
            return res.status(404).json({ success: false, message: 'Fee structure not found' });
        }

        // Get or create student fee record
        let studentFee = await StudentFee.findOne({
            student: studentId,
            feeStructure: feeStructureId
        });

        if (!studentFee) {
            const finalAmount = feeStructure.calculateStudentAmount(studentId);
            studentFee = new StudentFee({
                student: studentId,
                feeStructure: feeStructureId,
                school: feeStructure.school,
                academicYear: feeStructure.academicYear,
                totalAmount: feeStructure.amount,
                finalAmount: finalAmount,
                pendingAmount: finalAmount,
                dueDate: feeStructure.dueDate,
                installments: feeStructure.installments.map(inst => ({
                    installmentNumber: inst.installmentNumber,
                    amount: inst.amount,
                    dueDate: inst.dueDate,
                    paidAmount: 0,
                    status: 'pending'
                }))
            });
            await studentFee.save();
        }

        // Validate payment amount
        const maxPayableAmount = studentFee.pendingAmount + studentFee.lateFeeAmount;
        if (amount > maxPayableAmount) {
            return res.status(400).json({
                success: false,
                message: `Payment amount cannot exceed pending amount: ${maxPayableAmount}`
            });
        }

        // Check for duplicate payment attempts
        const existingPendingPayment = await Payment.findOne({
            student: studentId,
            feeStructure: feeStructureId,
            status: { $in: ['pending', 'processing'] },
            amount: amount,
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
        });

        if (existingPendingPayment) {
            return res.status(409).json({
                success: false,
                message: 'A similar payment is already in progress',
                paymentId: existingPendingPayment.paymentId
            });
        }

        // Create payment record
        const payment = new Payment({
            student: studentId,
            feeStructure: feeStructureId,
            school: feeStructure.school,
            amount: amount,
            currency: currency,
            paymentType: paymentType,
            installmentNumber: installmentNumber,
            paymentGateway: paymentGateway,
            paymentMethod: 'card', // Default, will be updated after payment
            status: 'pending',
            description: `Fee payment for ${feeStructure.name}`,
            lateFeeAmount: studentFee.lateFeeAmount,
            lateFeeIncluded: studentFee.lateFeeAmount > 0
        });

        await payment.save();

        // Add audit log
        await payment.addAuditLog(
            'payment_initiated',
            studentId,
            'student',
            { amount, paymentType, paymentGateway },
            req
        );

        // Initialize payment gateway
        const gatewayConfig = {
            secretKey: process.env[`${paymentGateway.toUpperCase()}_SECRET_KEY`],
            publicKey: process.env[`${paymentGateway.toUpperCase()}_PUBLIC_KEY`]
        };

        const gateway = PaymentGatewayFactory.create(paymentGateway, gatewayConfig);

        // Create payment intent with gateway
        const paymentIntentData = {
            amount: amount,
            currency: currency,
            description: payment.description,
            metadata: {
                paymentId: payment.paymentId,
                studentId: studentId,
                feeStructureId: feeStructureId,
                schoolId: feeStructure.school.toString()
            },
            customer: {
                email: student.email,
                name: student.name,
                phone: student.phone
            }
        };

        const result = await gateway.createPaymentIntent(paymentIntentData);

        if (!result.success) {
            payment.status = 'failed';
            payment.failureReason = result.error.message;
            payment.failureCode = result.error.code;
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Failed to create payment intent',
                error: result.error
            });
        }

        // Update payment with gateway information
        payment.gatewayPaymentId = result.paymentIntent.id;
        payment.gatewayResponse = result.paymentIntent.gatewayResponse;
        await payment.save();

        res.json({
            success: true,
            paymentIntent: {
                paymentId: payment.paymentId,
                clientSecret: result.paymentIntent.clientSecret,
                amount: amount,
                currency: currency,
                gatewayPaymentId: result.paymentIntent.id
            },
            studentFee: {
                totalAmount: studentFee.finalAmount,
                paidAmount: studentFee.paidAmount,
                pendingAmount: studentFee.pendingAmount,
                lateFeeAmount: studentFee.lateFeeAmount
            }
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Verify payment
const verifyPayment = async (req, res) => {
    try {
        const { paymentId, gatewayPaymentId } = req.body;

        const payment = await Payment.findOne({ paymentId })
            .populate('student', 'name email rollNum')
            .populate('feeStructure', 'name amount');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Initialize payment gateway
        const gatewayConfig = {
            secretKey: process.env[`${payment.paymentGateway.toUpperCase()}_SECRET_KEY`]
        };

        const gateway = PaymentGatewayFactory.create(payment.paymentGateway, gatewayConfig);

        // Verify payment with gateway
        const verificationResult = await gateway.verifyPayment(gatewayPaymentId);

        if (!verificationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                error: verificationResult.error
            });
        }

        const gatewayPayment = verificationResult.payment;
        const isSuccessful = gatewayPayment.status === 'completed';

        // Update payment status
        payment.status = gatewayPayment.status;
        payment.transactionId = gatewayPayment.id;
        payment.paymentMethod = gatewayPayment.paymentMethod?.type || 'card';
        payment.gatewayResponse = gatewayPayment.gatewayResponse;

        if (isSuccessful) {
            payment.completedAt = new Date();
            payment.generateReceiptNumber();
        } else if (gatewayPayment.status === 'failed') {
            payment.failedAt = new Date();
            payment.failureReason = gatewayPayment.error?.message || 'Payment failed';
        }

        await payment.save();

        // Update student fee record if payment successful
        if (isSuccessful) {
            const studentFee = await StudentFee.findOne({
                student: payment.student._id,
                feeStructure: payment.feeStructure._id
            });

            if (studentFee) {
                await studentFee.addPayment(payment._id, payment.amount);
            }
        }

        // Add audit log
        await payment.addAuditLog(
            isSuccessful ? 'payment_completed' : 'payment_failed',
            payment.student._id,
            'student',
            { 
                status: payment.status,
                transactionId: payment.transactionId,
                amount: payment.amount
            },
            req
        );

        res.json({
            success: true,
            payment: {
                paymentId: payment.paymentId,
                status: payment.status,
                amount: payment.amount,
                transactionId: payment.transactionId,
                receiptNumber: payment.receiptNumber,
                completedAt: payment.completedAt
            }
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get student fee details
const getStudentFeeDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { academicYear } = req.query;

        const query = { student: studentId };
        if (academicYear) {
            query.academicYear = academicYear;
        }

        const studentFees = await StudentFee.find(query)
            .populate('feeStructure', 'name feeType amount dueDate paymentFrequency')
            .populate('payments.payment', 'paymentId transactionId amount status paymentDate receiptNumber')
            .sort({ dueDate: 1 });

        const feesSummary = {
            totalFees: 0,
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
            fees: []
        };

        studentFees.forEach(fee => {
            feesSummary.totalFees += fee.finalAmount;
            feesSummary.totalPaid += fee.paidAmount;
            feesSummary.totalPending += fee.pendingAmount;
            
            if (fee.isOverdue && fee.pendingAmount > 0) {
                feesSummary.totalOverdue += fee.pendingAmount;
            }

            feesSummary.fees.push({
                id: fee._id,
                feeStructure: fee.feeStructure,
                totalAmount: fee.finalAmount,
                paidAmount: fee.paidAmount,
                pendingAmount: fee.pendingAmount,
                lateFeeAmount: fee.lateFeeAmount,
                status: fee.status,
                dueDate: fee.dueDate,
                isOverdue: fee.isOverdue,
                daysOverdue: fee.daysOverdue,
                lastPaymentDate: fee.lastPaymentDate,
                payments: fee.payments,
                installments: fee.installments
            });
        });

        res.json({
            success: true,
            studentId: studentId,
            academicYear: academicYear,
            summary: feesSummary
        });

    } catch (error) {
        console.error('Error fetching student fee details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

        const query = { student: studentId };
        
        if (status) {
            query.status = status;
        }
        
        if (dateFrom || dateTo) {
            query.paymentDate = {};
            if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
            if (dateTo) query.paymentDate.$lte = new Date(dateTo);
        }

        const payments = await Payment.find(query)
            .populate('feeStructure', 'name feeType')
            .sort({ paymentDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        res.json({
            success: true,
            payments: payments.map(payment => ({
                paymentId: payment.paymentId,
                transactionId: payment.transactionId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                paymentGateway: payment.paymentGateway,
                paymentDate: payment.paymentDate,
                receiptNumber: payment.receiptNumber,
                feeStructure: payment.feeStructure,
                description: payment.description
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Generate payment receipt
const generatePaymentReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findOne({ paymentId })
            .populate('student', 'name email rollNum phone address')
            .populate('feeStructure', 'name feeType description')
            .populate('school', 'schoolName address phone email');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ 
                success: false, 
                message: 'Receipt can only be generated for completed payments' 
            });
        }

        // Create PDF receipt
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment.receiptNumber}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(payment.school.schoolName, { align: 'center' });
        doc.fontSize(12).text(payment.school.address, { align: 'center' });
        doc.text(`Phone: ${payment.school.phone} | Email: ${payment.school.email}`, { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(16).text('PAYMENT RECEIPT', { align: 'center', underline: true });
        doc.moveDown();

        // Receipt details
        const leftColumn = 50;
        const rightColumn = 300;
        let yPosition = doc.y;

        doc.fontSize(12);
        doc.text('Receipt Number:', leftColumn, yPosition);
        doc.text(payment.receiptNumber, rightColumn, yPosition);
        yPosition += 20;

        doc.text('Payment Date:', leftColumn, yPosition);
        doc.text(payment.completedAt.toLocaleDateString(), rightColumn, yPosition);
        yPosition += 20;

        doc.text('Transaction ID:', leftColumn, yPosition);
        doc.text(payment.transactionId, rightColumn, yPosition);
        yPosition += 30;

        // Student details
        doc.fontSize(14).text('Student Details:', leftColumn, yPosition);
        yPosition += 20;

        doc.fontSize(12);
        doc.text('Name:', leftColumn, yPosition);
        doc.text(payment.student.name, rightColumn, yPosition);
        yPosition += 20;

        doc.text('Roll Number:', leftColumn, yPosition);
        doc.text(payment.student.rollNum, rightColumn, yPosition);
        yPosition += 20;

        doc.text('Email:', leftColumn, yPosition);
        doc.text(payment.student.email, rightColumn, yPosition);
        yPosition += 30;

        // Payment details
        doc.fontSize(14).text('Payment Details:', leftColumn, yPosition);
        yPosition += 20;

        doc.fontSize(12);
        doc.text('Fee Type:', leftColumn, yPosition);
        doc.text(payment.feeStructure.name, rightColumn, yPosition);
        yPosition += 20;

        doc.text('Payment Method:', leftColumn, yPosition);
        doc.text(payment.paymentMethod.toUpperCase(), rightColumn, yPosition);
        yPosition += 20;

        doc.text('Amount Paid:', leftColumn, yPosition);
        doc.text(`${payment.currency} ${payment.amount.toFixed(2)}`, rightColumn, yPosition);
        yPosition += 20;

        if (payment.lateFeeIncluded && payment.lateFeeAmount > 0) {
            doc.text('Late Fee:', leftColumn, yPosition);
            doc.text(`${payment.currency} ${payment.lateFeeAmount.toFixed(2)}`, rightColumn, yPosition);
            yPosition += 20;
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(10).text('This is a computer-generated receipt and does not require a signature.', { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Handle webhook from payment gateway
const handleWebhook = async (req, res) => {
    try {
        const { gateway } = req.params;
        const signature = req.get('stripe-signature') || req.get('x-razorpay-signature');
        const payload = req.body;

        // Initialize payment gateway
        const gatewayConfig = {
            secretKey: process.env[`${gateway.toUpperCase()}_SECRET_KEY`],
            webhookSecret: process.env[`${gateway.toUpperCase()}_WEBHOOK_SECRET`]
        };

        const gatewayInstance = PaymentGatewayFactory.create(gateway, gatewayConfig);

        // Validate webhook signature
        const validation = gatewayInstance.validateWebhookSignature(
            payload,
            signature,
            gatewayConfig.webhookSecret
        );

        if (!validation.success) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        const event = gatewayInstance.parseWebhookEvent(payload);

        // Process webhook event
        await processWebhookEvent(event, gateway);

        res.json({ success: true, message: 'Webhook processed successfully' });

    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: error.message
        });
    }
};

// Process webhook event
const processWebhookEvent = async (event, gateway) => {
    try {
        const { type, data } = event;

        switch (type) {
            case 'payment_intent.succeeded':
            case 'charge.succeeded':
                await handleSuccessfulPayment(data.object, gateway);
                break;
                
            case 'payment_intent.payment_failed':
            case 'charge.failed':
                await handleFailedPayment(data.object, gateway);
                break;
                
            case 'payment_intent.canceled':
                await handleCanceledPayment(data.object, gateway);
                break;
                
            default:
                console.log(`Unhandled webhook event type: ${type}`);
        }
    } catch (error) {
        console.error('Error processing webhook event:', error);
        throw error;
    }
};

// Handle successful payment webhook
const handleSuccessfulPayment = async (paymentData, gateway) => {
    const payment = await Payment.findOne({ gatewayPaymentId: paymentData.id });
    
    if (!payment) {
        console.error('Payment not found for gateway payment ID:', paymentData.id);
        return;
    }

    if (payment.status === 'completed') {
        return; // Already processed
    }

    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.transactionId = paymentData.id;
    payment.gatewayResponse = paymentData;
    
    if (!payment.receiptNumber) {
        payment.generateReceiptNumber();
    }

    await payment.save();

    // Update student fee record
    const studentFee = await StudentFee.findOne({
        student: payment.student,
        feeStructure: payment.feeStructure
    });

    if (studentFee) {
        await studentFee.addPayment(payment._id, payment.amount);
    }

    // Add audit log
    await payment.addAuditLog(
        'payment_completed_webhook',
        null,
        'admin',
        { gateway, webhookData: paymentData }
    );
};

// Handle failed payment webhook
const handleFailedPayment = async (paymentData, gateway) => {
    const payment = await Payment.findOne({ gatewayPaymentId: paymentData.id });
    
    if (!payment) {
        console.error('Payment not found for gateway payment ID:', paymentData.id);
        return;
    }

    payment.status = 'failed';
    payment.failedAt = new Date();
    payment.failureReason = paymentData.last_payment_error?.message || 'Payment failed';
    payment.failureCode = paymentData.last_payment_error?.code;
    payment.gatewayResponse = paymentData;

    await payment.save();

    // Add audit log
    await payment.addAuditLog(
        'payment_failed_webhook',
        null,
        'admin',
        { gateway, webhookData: paymentData }
    );
};

// Handle canceled payment webhook
const handleCanceledPayment = async (paymentData, gateway) => {
    const payment = await Payment.findOne({ gatewayPaymentId: paymentData.id });
    
    if (!payment) {
        console.error('Payment not found for gateway payment ID:', paymentData.id);
        return;
    }

    payment.status = 'cancelled';
    payment.gatewayResponse = paymentData;

    await payment.save();

    // Add audit log
    await payment.addAuditLog(
        'payment_cancelled_webhook',
        null,
        'admin',
        { gateway, webhookData: paymentData }
    );
};

module.exports = {
    createCheckoutSession,
    handleStripeWebhook,
    verifyCheckoutSession,
    createPaymentIntent,
    verifyPayment,
    getStudentFeeDetails,
    getPaymentHistory,
    generatePaymentReceipt,
    handleWebhook
};