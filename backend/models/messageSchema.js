const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['student', 'teacher']
    },
    senderRole: {
        type: String,
        required: true,
        enum: ['Student', 'Teacher']
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'image'],
        default: 'text'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, { 
    timestamps: true 
});

// Indexes for efficient queries
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, senderModel: 1 });
messageSchema.index({ chat: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("message", messageSchema);