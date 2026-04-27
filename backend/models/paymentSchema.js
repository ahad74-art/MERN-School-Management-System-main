const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Payment Identification
    paymentId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: () => {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substr(2, 5);
            return `PAY_${timestamp}_${random}`.toUpperCase();
        }
    },
    transactionId: {
        type: String,
        sparse: true, // Allows multiple null values but unique non-null values
        index: true
    },
    
    // Student and Fee Information
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true,
        index: true
    },
    feeStructure: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'feeStructure',
        required: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
        index: true
    },
    
    // Payment Details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'PKR',
        uppercase: true
    },
    paymentType: {
        type: String,
        enum: ['full', 'partial', 'installment'],
        required: true,
        default: 'full'
    },
    installmentNumber: {
        type: Number,
        min: 1
    },
    
    // Payment Gateway Information
    paymentGateway: {
        type: String,
        enum: ['stripe', 'razorpay', 'paypal', 'manual', 'easypaisa', 'jazzcash', 'bank_transfer'],
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'upi', 'wallet', 'cash', 'cheque', 'demand_draft', 'easypaisa', 'jazzcash'],
        required: true
    },
    gatewayPaymentId: {
        type: String,
        sparse: true
    },
    gatewayOrderId: {
        type: String,
        sparse: true
    },
    
    // Payment Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
        required: true,
        default: 'pending',
        index: true
    },
    paymentDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    completedAt: {
        type: Date
    },
    failedAt: {
        type: Date
    },
    
    // Additional Payment Information
    description: {
        type: String,
        maxlength: 500
    },
    receiptNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    receiptUrl: {
        type: String
    },
    
    // Late Fee Information
    lateFeeAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    lateFeeIncluded: {
        type: Boolean,
        default: false
    },
    
    // Refund Information
    refunds: [{
        refundId: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        reason: {
            type: String,
            required: true,
            maxlength: 500
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        processedAt: {
            type: Date
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'admin'
        }
    }],
    
    // Manual Payment Information (for offline payments)
    manualPayment: {
        isManual: {
            type: Boolean,
            default: false
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'admin'
        },
        recordedAt: {
            type: Date
        },
        notes: {
            type: String,
            maxlength: 1000
        },
        attachments: [{
            fileName: String,
            filePath: String,
            fileSize: Number,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // Gateway Response Data
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // Failure Information
    failureReason: {
        type: String,
        maxlength: 500
    },
    failureCode: {
        type: String
    },
    
    // Audit Trail
    auditLog: [{
        action: {
            type: String,
            required: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'auditLog.performedByModel'
        },
        performedByModel: {
            type: String,
            enum: ['admin', 'student']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: {
            type: mongoose.Schema.Types.Mixed
        },
        ipAddress: String,
        userAgent: String
    }],
    
    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, { 
    timestamps: true 
});

// Indexes for better query performance
paymentSchema.index({ student: 1, paymentDate: -1 });
paymentSchema.index({ school: 1, status: 1, paymentDate: -1 });
paymentSchema.index({ feeStructure: 1, status: 1 });
paymentSchema.index({ paymentGateway: 1, gatewayPaymentId: 1 });
paymentSchema.index({ receiptNumber: 1 }, { sparse: true });

// Virtual for total refunded amount
paymentSchema.virtual('totalRefundedAmount').get(function() {
    return this.refunds
        .filter(refund => refund.status === 'completed')
        .reduce((total, refund) => total + refund.amount, 0);
});

// Virtual for net amount (amount - refunds)
paymentSchema.virtual('netAmount').get(function() {
    return this.amount - this.totalRefundedAmount;
});

// Method to generate receipt number
paymentSchema.methods.generateReceiptNumber = function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    this.receiptNumber = `RCP-${year}${month}${day}-${random}`;
    return this.receiptNumber;
};

// Method to add audit log entry
paymentSchema.methods.addAuditLog = function(action, performedBy, performedByModel, details = {}, req = null) {
    const logEntry = {
        action,
        performedBy,
        performedByModel,
        details,
        timestamp: new Date()
    };
    
    if (req) {
        logEntry.ipAddress = req.ip || req.connection.remoteAddress;
        logEntry.userAgent = req.get('User-Agent');
    }
    
    this.auditLog.push(logEntry);
    return this.save();
};

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function() {
    return this.status === 'completed' && this.totalRefundedAmount < this.amount;
};

// Method to calculate refundable amount
paymentSchema.methods.getRefundableAmount = function() {
    if (!this.canBeRefunded()) return 0;
    return this.amount - this.totalRefundedAmount;
};

// Pre-save middleware to generate payment ID
paymentSchema.pre('save', function(next) {
    if (this.isNew && !this.paymentId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.paymentId = `PAY_${timestamp}_${random}`.toUpperCase();
    }
    
    // Set completed/failed timestamps
    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status === 'failed' && !this.failedAt) {
            this.failedAt = new Date();
        }
    }
    
    next();
});

module.exports = mongoose.model('payment', paymentSchema);