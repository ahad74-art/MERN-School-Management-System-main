import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentUser = null;
    }

    // Initialize socket connection
    connect(userData) {
        if (this.socket && this.isConnected) {
            return this.socket;
        }

        const serverUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';
        
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });

        this.currentUser = userData;

        // Connection event handlers
        this.socket.on('connect', () => {
            console.log('Connected to chat server');
            this.isConnected = true;
            
            // Join user to their personal room
            this.socket.emit('join', userData);
        });

        this.socket.on('connected', (data) => {
            console.log('Successfully joined chat server:', data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.isConnected = false;
        });

        return this.socket;
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.currentUser = null;
        }
    }

    // Join a specific chat room
    joinChat(chatId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('joinChat', chatId);
            console.log(`Joined chat room: ${chatId}`);
        }
    }

    // Leave a specific chat room
    leaveChat(chatId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leaveChat', chatId);
            console.log(`Left chat room: ${chatId}`);
        }
    }

    // Send a message
    sendMessage(messageData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('sendMessage', messageData);
        } else {
            console.error('Socket not connected. Cannot send message.');
        }
    }

    // Send typing indicator
    sendTyping(chatId, isTyping) {
        if (this.socket && this.isConnected && this.currentUser) {
            this.socket.emit('typing', {
                chatId,
                userId: this.currentUser.userId,
                userName: this.currentUser.userName,
                isTyping
            });
        }
    }

    // Mark messages as read
    markAsRead(chatId) {
        if (this.socket && this.isConnected && this.currentUser) {
            this.socket.emit('markAsRead', {
                chatId,
                userId: this.currentUser.userId,
                userRole: this.currentUser.userRole
            });
        }
    }

    // Listen for new messages
    onNewMessage(callback) {
        if (this.socket) {
            this.socket.on('newMessage', callback);
        }
    }

    // Listen for message notifications
    onMessageNotification(callback) {
        if (this.socket) {
            this.socket.on('messageNotification', callback);
        }
    }

    // Listen for typing indicators
    onUserTyping(callback) {
        if (this.socket) {
            this.socket.on('userTyping', callback);
        }
    }

    // Listen for user status changes
    onUserStatusChange(callback) {
        if (this.socket) {
            this.socket.on('userStatusChange', callback);
        }
    }

    // Listen for messages read status
    onMessagesRead(callback) {
        if (this.socket) {
            this.socket.on('messagesRead', callback);
        }
    }

    // Listen for errors
    onError(callback) {
        if (this.socket) {
            this.socket.on('messageError', callback);
            this.socket.on('readError', callback);
        }
    }

    // Remove all listeners
    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }

    // Remove specific listener
    removeListener(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            socketId: this.socket?.id,
            currentUser: this.currentUser
        };
    }

    // Get socket instance
    getSocket() {
        return this.socket;
    }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;