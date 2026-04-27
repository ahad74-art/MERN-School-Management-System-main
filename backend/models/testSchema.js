const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true
    },
    sclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 0
    },
    passingMarks: {
        type: Number,
        required: true,
        min: 0
    },
    testDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    // Student results
    results: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'student'
        },
        marksObtained: {
            type: Number,
            min: 0
        },
        status: {
            type: String,
            enum: ['absent', 'present', 'pending'],
            default: 'pending'
        },
        remarks: {
            type: String
        }
    }],
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
testSchema.index({ teacher: 1, status: 1 });
testSchema.index({ sclass: 1, subject: 1 });
testSchema.index({ school: 1, testDate: 1 });

module.exports = mongoose.model('test', testSchema);
