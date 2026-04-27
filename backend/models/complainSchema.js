const mongoose = require('mongoose');

const complainSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    complaint: {
        type: String,
        required: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Review', 'Resolved', 'Closed'],
        default: 'Pending'
    },
    category: {
        type: String,
        enum: ['Academic', 'Behavioral', 'Facility', 'Administrative', 'Other'],
        default: 'Other'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: false
    },
    response: {
        type: String,
        required: false
    },
    responseBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: false
    },
    responseDate: {
        type: Date,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model("complain", complainSchema);