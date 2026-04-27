const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'message'
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    unreadCount: {
        student: {
            type: Number,
            default: 0
        },
        teacher: {
            type: Number,
            default: 0
        }
    }
}, { 
    timestamps: true 
});

// Compound index to ensure one chat per student-teacher pair
chatSchema.index({ student: 1, teacher: 1 }, { unique: true });

// Index for efficient queries
chatSchema.index({ lastMessageTime: -1 });
chatSchema.index({ student: 1, isActive: 1 });
chatSchema.index({ teacher: 1, isActive: 1 });

module.exports = mongoose.model("chat", chatSchema);