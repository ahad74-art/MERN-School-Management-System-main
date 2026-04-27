const Chat = require('../models/chatSchema.js');
const Message = require('../models/messageSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
const nodemailer = require('nodemailer');

// Send email notification (non-blocking)
const sendMessageEmail = async (receiverEmail, receiverName, senderName, messageContent) => {
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
                    <h2 style="color:#1E293B;margin-bottom:8px;">New Message</h2>
                    <p style="color:#64748B;">Hello <strong>${receiverName}</strong>,</p>
                    <p style="color:#64748B;">You have a new message from <strong>${senderName}</strong>:</p>
                    <div style="background:#F8FAFC;border-left:4px solid #1E3A8A;padding:16px;border-radius:8px;margin:16px 0;">
                        <p style="color:#1E293B;margin:0;">${messageContent}</p>
                    </div>
                    <p style="color:#94A3B8;font-size:13px;">Log in to reply.</p>
                    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
                    <p style="color:#CBD5E1;font-size:12px;">School Management System</p>
                </div>
            `,
        });
        console.log(`📧 Email notification sent to ${receiverEmail}`);
    } catch (err) {
        console.error('Email notification failed:', err.message);
    }
};

const setupChatSocket = (io) => {
    // Store active users and their socket connections
    const activeUsers = new Map();
    
    // ============================================
    // ONLINE/OFFLINE STATUS TRACKING
    // ============================================
    // Map structure: userId -> Set of socket IDs
    // This supports multiple tabs/devices per user
    const onlineUsers = new Map();

    /**
     * Mark user as online by adding their socket ID
     * @param {string} userId - The user's ID
     * @param {string} socketId - The socket connection ID
     */
    const addUserSocket = (userId, socketId) => {
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socketId);
    };

    /**
     * Remove a socket ID from user's active connections
     * @param {string} userId - The user's ID
     * @param {string} socketId - The socket connection ID
     * @returns {boolean} - True if user is still online (has other sockets)
     */
    const removeUserSocket = (userId, socketId) => {
        if (!onlineUsers.has(userId)) return false;
        
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socketId);
        
        // If no more sockets, remove user completely
        if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            return false; // User is now offline
        }
        
        return true; // User still has other active connections
    };

    /**
     * Check if a user is online
     * @param {string} userId - The user's ID
     * @returns {boolean} - True if user has at least one active connection
     */
    const isUserOnline = (userId) => {
        return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
    };

    /**
     * Get list of all online user IDs
     * @returns {Array} - Array of online user IDs
     */
    const getOnlineUserIds = () => {
        return Array.from(onlineUsers.keys());
    };

    /**
     * Emit user online status to all relevant users
     * @param {string} userId - The user who came online
     * @param {string} userRole - The user's role
     */
    const emitUserOnline = async (userId, userRole) => {
        try {
            // Find all chats involving this user
            let chats;
            if (userRole.toLowerCase() === 'student') {
                chats = await Chat.find({ student: userId }).populate('teacher', '_id');
            } else {
                chats = await Chat.find({ teacher: userId }).populate('student', '_id');
            }

            // Notify each chat participant
            chats.forEach(chat => {
                const otherUserId = userRole.toLowerCase() === 'student' 
                    ? chat.teacher?._id 
                    : chat.student?._id;
                
                if (otherUserId) {
                    io.to(`user_${otherUserId}`).emit('user-online', {
                        userId,
                        userRole,
                        timestamp: new Date()
                    });
                }
            });
        } catch (error) {
            console.error('Error emitting user online status:', error);
        }
    };

    /**
     * Emit user offline status to all relevant users
     * @param {string} userId - The user who went offline
     * @param {string} userRole - The user's role
     */
    const emitUserOffline = async (userId, userRole) => {
        try {
            // Find all chats involving this user
            let chats;
            if (userRole.toLowerCase() === 'student') {
                chats = await Chat.find({ student: userId }).populate('teacher', '_id');
            } else {
                chats = await Chat.find({ teacher: userId }).populate('student', '_id');
            }

            // Notify each chat participant
            chats.forEach(chat => {
                const otherUserId = userRole.toLowerCase() === 'student' 
                    ? chat.teacher?._id 
                    : chat.student?._id;
                
                if (otherUserId) {
                    io.to(`user_${otherUserId}`).emit('user-offline', {
                        userId,
                        userRole,
                        timestamp: new Date()
                    });
                }
            });
        } catch (error) {
            console.error('Error emitting user offline status:', error);
        }
    };
    // ============================================
    // END ONLINE/OFFLINE STATUS TRACKING
    // ============================================

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle user joining
        socket.on('join', (userData) => {
            const { userId, userRole, userName } = userData;
            
            // Store user info (existing functionality)
            activeUsers.set(socket.id, {
                userId,
                userRole,
                userName,
                socketId: socket.id
            });

            // Join user to their personal room (existing functionality)
            socket.join(`user_${userId}`);
            
            console.log(`${userName} (${userRole}) joined with ID: ${userId}`);
            
            // ============================================
            // ONLINE STATUS: Track this socket connection
            // ============================================
            const wasOffline = !isUserOnline(userId);
            addUserSocket(userId, socket.id);
            
            // If user was offline and is now online, emit online event
            if (wasOffline) {
                emitUserOnline(userId, userRole);
                console.log(`User ${userId} is now ONLINE`);
            }
            // ============================================
            
            // Notify user of successful connection (existing functionality)
            socket.emit('connected', {
                message: 'Connected to chat server',
                userId,
                socketId: socket.id,
                onlineUsers: getOnlineUserIds() // Send list of online users
            });

            // Broadcast user online status to relevant chats (existing functionality)
            broadcastUserStatus(io, userId, userRole, 'online');
        });

        // Handle joining a specific chat room
        socket.on('joinChat', (chatId) => {
            socket.join(`chat_${chatId}`);
            console.log(`Socket ${socket.id} joined chat room: chat_${chatId}`);
        });

        // Handle leaving a chat room
        socket.on('leaveChat', (chatId) => {
            socket.leave(`chat_${chatId}`);
            console.log(`Socket ${socket.id} left chat room: chat_${chatId}`);
        });

        // Handle sending messages
        socket.on('sendMessage', async (messageData) => {
            try {
                const { chatId, senderId, senderRole, content, messageType = 'text' } = messageData;

                // Validate required fields
                if (!chatId || !senderId || !senderRole || !content) {
                    socket.emit('messageError', { error: 'Missing required fields' });
                    return;
                }

                // Verify chat exists and user is authorized
                const chat = await Chat.findById(chatId);
                if (!chat) {
                    socket.emit('messageError', { error: 'Chat not found' });
                    return;
                }

                // Check if sender is part of the chat
                const isAuthorized = (senderRole.toLowerCase() === 'student' && chat.student.toString() === senderId) ||
                                   (senderRole.toLowerCase() === 'teacher' && chat.teacher.toString() === senderId);

                if (!isAuthorized) {
                    socket.emit('messageError', { error: 'Unauthorized to send message in this chat' });
                    return;
                }

                // Create the message
                const senderModel = senderRole.toLowerCase() === 'student' ? 'student' : 'teacher';
                
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

                // Populate sender info
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'name email rollNum');

                // Emit message to all users in the chat room
                io.to(`chat_${chatId}`).emit('newMessage', populatedMessage);

                // Send notification to the receiver if they're online but not in the chat room
                const receiverId = senderRole.toLowerCase() === 'student' ? chat.teacher : chat.student;
                io.to(`user_${receiverId}`).emit('messageNotification', {
                    chatId,
                    message: populatedMessage,
                    senderName: populatedMessage.sender.name
                });

                // Send email notification to receiver
                try {
                    if (senderRole.toLowerCase() === 'student') {
                        const teacher = await Teacher.findById(chat.teacher).select('name email');
                        if (teacher?.email) {
                            sendMessageEmail(
                                teacher.email,
                                teacher.name,
                                populatedMessage.sender.name,
                                content.trim()
                            );
                        }
                    } else {
                        const student = await Student.findById(chat.student).select('name email');
                        if (student?.email) {
                            sendMessageEmail(
                                student.email,
                                student.name,
                                populatedMessage.sender.name,
                                content.trim()
                            );
                        }
                    }
                } catch (emailErr) {
                    console.error('Email lookup error:', emailErr.message);
                }

                console.log(`Message sent in chat ${chatId} by ${senderRole} ${senderId}`);

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('messageError', { error: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
            const { chatId, userId, userName, isTyping } = data;
            socket.to(`chat_${chatId}`).emit('userTyping', { userId, userName, isTyping });
        });

        // Handle delete message — broadcast to chat room
        socket.on('deleteMessage', ({ messageId, chatId }) => {
            io.to(`chat_${chatId}`).emit('messageDeleted', { messageId });
        });

        // Handle message read status
        socket.on('markAsRead', async (data) => {
            const { chatId, userId, userName, isTyping } = data;
            socket.to(`chat_${chatId}`).emit('userTyping', {
                userId,
                userName,
                isTyping
            });
        });

        // Handle message read status
        socket.on('markAsRead', async (data) => {
            try {
                const { chatId, userId, userRole } = data;

                // Mark messages as read in database
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

                // Reset unread count
                const updateField = userRole.toLowerCase() === 'student' ? 'unreadCount.student' : 'unreadCount.teacher';
                await Chat.findByIdAndUpdate(chatId, { [updateField]: 0 });

                // Notify other users in the chat
                socket.to(`chat_${chatId}`).emit('messagesRead', {
                    chatId,
                    readBy: userId,
                    readAt: new Date()
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('readError', { error: 'Failed to mark messages as read' });
            }
        });

        // ============================================
        // NEW: Request online status for specific users
        // ============================================
        socket.on('checkOnlineStatus', (userIds) => {
            const onlineStatus = {};
            userIds.forEach(userId => {
                onlineStatus[userId] = isUserOnline(userId);
            });
            socket.emit('onlineStatusResponse', onlineStatus);
        });
        // ============================================

        // Handle disconnection
        socket.on('disconnect', () => {
            const user = activeUsers.get(socket.id);
            if (user) {
                console.log(`${user.userName} (${user.userRole}) disconnected`);
                
                // ============================================
                // OFFLINE STATUS: Remove this socket connection
                // ============================================
                const stillOnline = removeUserSocket(user.userId, socket.id);
                
                // If user has no more active connections, emit offline event
                if (!stillOnline) {
                    emitUserOffline(user.userId, user.userRole);
                    console.log(`User ${user.userId} is now OFFLINE`);
                }
                // ============================================
                
                // Broadcast user offline status (existing functionality)
                if (!stillOnline) {
                    broadcastUserStatus(io, user.userId, user.userRole, 'offline');
                }
                
                // Remove user from active users (existing functionality)
                activeUsers.delete(socket.id);
            }
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    // Helper function to broadcast user status (existing functionality)
    const broadcastUserStatus = async (io, userId, userRole, status) => {
        try {
            // Find all chats involving this user
            let chats;
            if (userRole.toLowerCase() === 'student') {
                chats = await Chat.find({ student: userId });
            } else {
                chats = await Chat.find({ teacher: userId });
            }

            // Notify all relevant chat rooms about user status change
            chats.forEach(chat => {
                io.to(`chat_${chat._id}`).emit('userStatusChange', {
                    userId,
                    userRole,
                    status,
                    timestamp: new Date()
                });
            });
        } catch (error) {
            console.error('Error broadcasting user status:', error);
        }
    };

    // Helper function to get online users (existing functionality)
    const getOnlineUsers = () => {
        return Array.from(activeUsers.values());
    };

    return {
        getOnlineUsers,
        activeUsers,
        isUserOnline,        // NEW: Export online status checker
        getOnlineUserIds     // NEW: Export online users list
    };
};

module.exports = setupChatSocket;