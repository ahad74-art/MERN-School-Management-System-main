const mongoose = require('mongoose');

const studentFeeSchema = new mongoose.Schema({
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
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}-\d{4}$/
    },
    
    // Fee Calculation
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Payment Tracking
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    pendingAmount: {
        type: Number,
        required: true,
        min: 0
    },
    lateFeeAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'partially_paid', 'fully_paid', 'overdue', 'waived'],
        default: 'pending',
        index: true
    },
    
    // Important Dates
    dueDate: {
        type: Date,
        required: true,
        index: true
    },
    lastPaymentDate: {
        type: Date
    },
    fullyPaidDate: {
        type: Date
    },
    
    // Installment Tracking
    installments: [{
        installmentNumber: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        dueDate: {
            type: Date,
            required: true
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        status: {
            type: String,
            enum: ['pending', 'partially_paid', 'fully_paid', 'overdue'],
            default: 'pending'
        },
        paidDate: {
            type: Date
        },
        payments: [{
            payment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'payment'
            },
            amount: {
                type: Number,
                required: true,
                min: 0
            },
            paidAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    
    // Payment History
    payments: [{
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'payment'
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        paidAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['completed', 'refunded', 'partially_refunded'],
            default: 'completed'
        }
    }],
    
    // Reminders
    reminders: [{
        type: {
            type: String,
            enum: ['email', 'sms', 'push', 'in_app'],
            required: true
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
        },
        reminderType: {
            type: String,
            enum: ['due_soon', 'overdue', 'final_notice'],
            required: true
        }
    }],
    
    // Waiver Information
    waiver: {
        isWaived: {
            type: Boolean,
            default: false
        },
        waivedAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        reason: {
            type: String,
            maxlength: 500
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'admin'
        },
        approvedAt: {
            type: Date
        }
    },
    
    // Notes and Comments
    notes: [{
        note: {
            type: String,
            required: true,
            maxlength: 1000
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'notes.addedByModel'
        },
        addedByModel: {
            type: String,
            enum: ['admin', 'student']
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        isPrivate: {
            type: Boolean,
            default: false
        }
    }]
}, { 
    timestamps: true 
});

// Compound indexes
studentFeeSchema.index({ student: 1, academicYear: 1, feeStructure: 1 }, { unique: true });
studentFeeSchema.index({ school: 1, status: 1, dueDate: 1 });
studentFeeSchema.index({ dueDate: 1, status: 1 });

// Virtual for overdue status
studentFeeSchema.virtual('isOverdue').get(function() {
    return this.status !== 'fully_paid' && new Date() > this.dueDate;
});

// Virtual for days overdue
studentFeeSchema.virtual('daysOverdue').get(function() {
    if (!this.isOverdue) return 0;
    const now = new Date();
    const diffTime = now - this.dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update payment status
studentFeeSchema.methods.updatePaymentStatus = function() {
    const totalPaid = this.paidAmount;
    const finalAmount = this.finalAmount;
    
    if (totalPaid === 0) {
        this.status = this.isOverdue ? 'overdue' : 'pending';
    } else if (totalPaid >= finalAmount) {
        this.status = 'fully_paid';
        if (!this.fullyPaidDate) {
            this.fullyPaidDate = new Date();
        }
    } else {
        this.status = this.isOverdue ? 'overdue' : 'partially_paid';
    }
    
    this.pendingAmount = Math.max(0, finalAmount - totalPaid);
    return this.save();
};

// Method to add payment
studentFeeSchema.methods.addPayment = function(paymentId, amount) {
    this.payments.push({
        payment: paymentId,
        amount: amount,
        paidAt: new Date()
    });
    
    this.paidAmount += amount;
    this.lastPaymentDate = new Date();
    
    return this.updatePaymentStatus();
};

// Method to calculate next installment due
studentFeeSchema.methods.getNextInstallmentDue = function() {
    const unpaidInstallments = this.installments.filter(
        inst => inst.status !== 'fully_paid'
    ).sort((a, b) => a.dueDate - b.dueDate);
    
    return unpaidInstallments.length > 0 ? unpaidInstallments[0] : null;
};

// Method to check if reminder should be sent
studentFeeSchema.methods.shouldSendReminder = function(reminderType) {
    const now = new Date();
    const lastReminder = this.reminders
        .filter(r => r.reminderType === reminderType)
        .sort((a, b) => b.sentAt - a.sentAt)[0];
    
    if (!lastReminder) return true;
    
    // Don't send same type of reminder within 24 hours
    const hoursSinceLastReminder = (now - lastReminder.sentAt) / (1000 * 60 * 60);
    return hoursSinceLastReminder >= 24;
};

// Method to add reminder
studentFeeSchema.methods.addReminder = function(type, reminderType, status = 'sent') {
    this.reminders.push({
        type,
        reminderType,
        status,
        sentAt: new Date()
    });
    return this.save();
};

// Static method to get overdue fees
studentFeeSchema.statics.getOverdueFees = function(schoolId, daysOverdue = 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);
    
    return this.find({
        school: schoolId,
        status: { $in: ['pending', 'partially_paid', 'overdue'] },
        dueDate: { $lt: cutoffDate }
    }).populate('student', 'name rollNum email phone')
      .populate('feeStructure', 'name feeType amount');
};

// Static method to get fee summary for school
studentFeeSchema.statics.getSchoolFeeSummary = function(schoolId, academicYear) {
    return this.aggregate([
        {
            $match: {
                school: new mongoose.Types.ObjectId(schoolId),
                academicYear: academicYear
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$finalAmount' },
                paidAmount: { $sum: '$paidAmount' },
                pendingAmount: { $sum: '$pendingAmount' }
            }
        }
    ]);
};

module.exports = mongoose.model('studentFee', studentFeeSchema);