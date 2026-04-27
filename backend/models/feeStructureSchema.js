const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 500
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    sclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}-\d{4}$/ // Format: 2024-2025
    },
    feeType: {
        type: String,
        enum: ['tuition', 'admission', 'exam', 'library', 'transport', 'hostel', 'miscellaneous'],
        required: true
    },
    paymentFrequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'one-time'],
        required: true,
        default: 'monthly'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'PKR',
        uppercase: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    lateFeeAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    lateFeeType: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'fixed'
    },
    gracePeriodDays: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
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
        description: {
            type: String,
            maxlength: 200
        }
    }],
    applicableStudents: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'student'
        },
        customAmount: {
            type: Number,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        discountType: {
            type: String,
            enum: ['fixed', 'percentage'],
            default: 'fixed'
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    }
}, { 
    timestamps: true 
});

// Indexes for better query performance
feeStructureSchema.index({ school: 1, sclass: 1, academicYear: 1 });
feeStructureSchema.index({ dueDate: 1, isActive: 1 });
feeStructureSchema.index({ 'applicableStudents.student': 1 });

// Virtual for calculated final amount after discount
feeStructureSchema.virtual('finalAmount').get(function() {
    return this.amount;
});

// Method to calculate final amount for a specific student
feeStructureSchema.methods.calculateStudentAmount = function(studentId) {
    const studentFee = this.applicableStudents.find(
        app => app.student.toString() === studentId.toString()
    );
    
    if (!studentFee) return this.amount;
    
    let finalAmount = studentFee.customAmount || this.amount;
    
    if (studentFee.discount > 0) {
        if (studentFee.discountType === 'percentage') {
            finalAmount = finalAmount - (finalAmount * studentFee.discount / 100);
        } else {
            finalAmount = finalAmount - studentFee.discount;
        }
    }
    
    return Math.max(0, finalAmount);
};

// Method to check if fee is overdue
feeStructureSchema.methods.isOverdue = function() {
    const now = new Date();
    const gracePeriodEnd = new Date(this.dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.gracePeriodDays);
    return now > gracePeriodEnd;
};

// Method to calculate late fee
feeStructureSchema.methods.calculateLateFee = function() {
    if (!this.isOverdue()) return 0;
    
    if (this.lateFeeType === 'percentage') {
        return (this.amount * this.lateFeeAmount) / 100;
    }
    return this.lateFeeAmount;
};

module.exports = mongoose.model('feeStructure', feeStructureSchema);