const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rollNum: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    phone: {
        type: String
    },
    address: {
        type: String
    },
    emergencyContact: {
        type: String
    },
    sclassName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    role: {
        type: String,
        default: "Student"
    },
    examResult: [
        {
            subName: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'subject',
            },
            marksObtained: {
                type: Number,
                default: 0
            }
        }
    ],
    attendance: [{
        date: { type: Date, required: true },
        status: { type: String, enum: ['Present', 'Absent'], required: true },
        subName: { type: mongoose.Schema.Types.ObjectId, ref: 'subject', required: true }
    }],
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
    resetOtpLastSent: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("student", studentSchema);