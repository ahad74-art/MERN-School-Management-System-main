const Chat = require('../models/chatSchema.js');
const Message = require('../models/messageSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
const nodemailer = require('nodemailer');

// ─── Email notification helper ────────────────────────────────────────────────
const sendMessageNotificationEmail = async (receiverEmail, receiverName, senderName, messageContent) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
            from: `"School Management" <${process.env.EMAIL_USER}>`,
            to: receiverEmail,
            subject: `New Message from ${senderName}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:12px;">
                    <h2 style="color:#1E293B;">New Message</h2>
                    <p style="color:#64748B;">Hello <strong>${receiverName}</strong>,</p>
                    <p style="color:#64748B;">You have a new message from <strong>${senderName}</strong>:</p>
                    <div style="background:#F8FAFC;border-left:4px solid #1E3A8A;padding:16px;border-radius:8px;margin:16px 0;">
                        <p style="color:#1E293B;margin:0;">${messageContent}</p>
                    </div>
                    <p style="color:#94A3B8;font-size:13px;">Log in to reply.</p>
                </div>
            `,
        });
    } catch (err) {
        console.error('Email notification failed:', err.message);
        // Don't throw — email failure shouldn't break message sending
    }
};

// Get or create a chat between student and teacher
const getOrCreateChat = async (req, res) => {
    try {
        const { studentId, teacherId } = req.body;

        if (!studentId || !teacherId) {
            return res.status(400).json({ message: 'Student ID and Teacher ID are required' });
        }

        // Check if student and teacher exist
        const student = await Student.findById(studentId);
        const teacher = await Teacher.findById(teacherId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Find existing chat or create new one
        let chat = await Chat.findOne({ student: studentId, teacher: teacherId })
            .populate('student', 'name rollNum')
            .populate('teacher', 'name email')
            .populate('lastMessage');

        if (!chat) {
            chat = new Chat({
                student: studentId,
                teacher: teacherId
            });
            await chat.save();
            
            // Populate the newly created chat
            chat = await Chat.findById(chat._id)
                .populate('student', 'name rollNum')
                .populate('teacher', 'name email')
                .populate('lastMessage');
        }

        res.json(chat);
    } catch (error) {
        console.error('Error in getOrCreateChat:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all chats for a user (student or teacher)
const getUserChats = async (req, res) => {
    try {
        const { userId, userRole } = req.params;

        if (!userId || !userRole) {
            return res.status(400).json({ message: 'User ID and role are required' });
        }

        let query = {};
        if (userRole.toLowerCase() === 'student') {
            query.student = userId;
        } else if (userRole.toLowerCase() === 'teacher') {
            query.teacher = userId;
        } else {
            return res.status(400).json({ message: 'Invalid user role' });
        }

        const chats = await Chat.find({ ...query, isActive: true })
            .populate('student', 'name rollNum email')
            .populate('teacher', 'name email')
            .populate('lastMessage')
            .sort({ lastMessageTime: -1 });

        res.json(chats);
    } catch (error) {
        console.error('Error in getUserChats:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { chatId, senderId, senderRole, content, messageType = 'text' } = req.body;

        if (!chatId || !senderId || !senderRole || !content) {
            return res.status(400).json({ message: 'Chat ID, sender ID, sender role, and content are required' });
        }

        // Verify chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Determine sender model based on role
        const senderModel = senderRole.toLowerCase() === 'student' ? 'student' : 'teacher';

        // Verify sender exists and is part of the chat
        if (senderRole.toLowerCase() === 'student') {
            if (chat.student.toString() !== senderId) {
                return res.status(403).json({ message: 'Unauthorized: Student not part of this chat' });
            }
        } else {
            if (chat.teacher.toString() !== senderId) {
                return res.status(403).json({ message: 'Unauthorized: Teacher not part of this chat' });
            }
        }

        // Create the message
        const message = new Message({
            chat: chatId,
            sender: senderId,
            senderModel: senderModel,
            senderRole: senderRole,
            content: content.trim(),
            messageType: messageType
        });

        await message.save();

        // Update chat with last message info and unread count
        const updateData = {
            lastMessage: message._id,
            lastMessageTime: message.createdAt
        };

        // Increment unread count for the receiver
        if (senderRole.toLowerCase() === 'student') {
            updateData['unreadCount.teacher'] = chat.unreadCount.teacher + 1;
        } else {
            updateData['unreadCount.student'] = chat.unreadCount.student + 1;
        }

        await Chat.findByIdAndUpdate(chatId, updateData);

        // Populate sender info for response
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email rollNum');

        // Send email notification to receiver (non-blocking)
        try {
            const populatedChat = await Chat.findById(chatId)
                .populate('student', 'name email')
                .populate('teacher', 'name email');

            if (senderRole.toLowerCase() === 'student') {
                // Notify teacher
                const teacher = populatedChat.teacher;
                if (teacher?.email) {
                    sendMessageNotificationEmail(
                        teacher.email, teacher.name,
                        populatedChat.student.name, content.trim()
                    );
                }
            } else {
                // Notify student
                const student = populatedChat.student;
                if (student?.email) {
                    sendMessageNotificationEmail(
                        student.email, student.name,
                        populatedChat.teacher.name, content.trim()
                    );
                }
            }
        } catch (emailErr) {
            console.error('Email notification error:', emailErr.message);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get messages for a chat
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        if (!chatId) {
            return res.status(400).json({ message: 'Chat ID is required' });
        }

        // Verify chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Message.find({ 
            chat: chatId, 
            isDeleted: false 
        })
            .populate('sender', 'name email rollNum')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Reverse to show oldest first
        messages.reverse();

        const totalMessages = await Message.countDocuments({ 
            chat: chatId, 
            isDeleted: false 
        });

        res.json({
            messages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalMessages / parseInt(limit)),
                totalMessages,
                hasMore: skip + messages.length < totalMessages
            }
        });
    } catch (error) {
        console.error('Error in getChatMessages:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
    try {
        const { chatId, userId, userRole } = req.body;

        if (!chatId || !userId || !userRole) {
            return res.status(400).json({ message: 'Chat ID, user ID, and user role are required' });
        }

        // Verify chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Mark unread messages as read
        const senderModel = userRole.toLowerCase() === 'student' ? 'teacher' : 'student';
        
        await Message.updateMany(
            { 
                chat: chatId, 
                senderModel: senderModel,
                isRead: false 
            },
            { 
                isRead: true, 
                readAt: new Date() 
            }
        );

        // Reset unread count for the user
        const updateField = userRole.toLowerCase() === 'student' ? 'unreadCount.student' : 'unreadCount.teacher';
        await Chat.findByIdAndUpdate(chatId, { [updateField]: 0 });

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get available teachers for a student to chat with
const getAvailableTeachers = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Get student to find their school
        const student = await Student.findById(studentId).populate('school');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get all teachers from the same school
        const teachers = await Teacher.find({ 
            school: student.school._id 
        }).select('name email subject');

        res.json(teachers);
    } catch (error) {
        console.error('Error in getAvailableTeachers:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get students for a teacher to chat with
const getTeacherStudents = async (req, res) => {
    try {
        const { teacherId } = req.params;

        if (!teacherId) {
            return res.status(400).json({ message: 'Teacher ID is required' });
        }

        // Get teacher to find their school
        const teacher = await Teacher.findById(teacherId).populate('school');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Get all students from the same school
        const students = await Student.find({ 
            school: teacher.school._id 
        })
            .populate('sclassName', 'sclassName')
            .select('name rollNum email sclassName');

        res.json(students);
    } catch (error) {
        console.error('Error in getTeacherStudents:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete a message (soft delete)
const deleteMessage = async (req, res) => {
    try {
        const { messageId, userId } = req.body;

        if (!messageId || !userId) {
            return res.status(400).json({ message: 'Message ID and User ID are required' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user is the sender
        if (message.sender.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: You can only delete your own messages' });
        }

        // Soft delete the message
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error in deleteMessage:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = {
    getOrCreateChat,
    getUserChats,
    sendMessage,
    getChatMessages,
    markMessagesAsRead,
    getAvailableTeachers,
    getTeacherStudents,
    deleteMessage
};