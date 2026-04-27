import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

// Create axios instance with default config
const chatAPI = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Chat API functions
export const chatService = {
    // Get or create a chat between student and teacher
    getOrCreateChat: async (studentId, teacherId) => {
        try {
            const response = await chatAPI.post('/ChatCreate', {
                studentId,
                teacherId
            });
            return response.data;
        } catch (error) {
            console.error('Error creating/getting chat:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get all chats for a user
    getUserChats: async (userId, userRole) => {
        try {
            const response = await chatAPI.get(`/UserChats/${userId}/${userRole}`);
            return response.data;
        } catch (error) {
            console.error('Error getting user chats:', error);
            throw error.response?.data || error.message;
        }
    },

    // Send a message (fallback for when socket is not available)
    sendMessage: async (messageData) => {
        try {
            const response = await chatAPI.post('/MessageSend', messageData);
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get messages for a chat
    getChatMessages: async (chatId, page = 1, limit = 50) => {
        try {
            const response = await chatAPI.get(`/ChatMessages/${chatId}`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting chat messages:', error);
            throw error.response?.data || error.message;
        }
    },

    // Mark messages as read
    markMessagesAsRead: async (chatId, userId, userRole) => {
        try {
            const response = await chatAPI.put('/MessagesRead', {
                chatId,
                userId,
                userRole
            });
            return response.data;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get available teachers for a student
    getAvailableTeachers: async (studentId) => {
        try {
            const response = await chatAPI.get(`/AvailableTeachers/${studentId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting available teachers:', error);
            throw error.response?.data || error.message;
        }
    },

    // Get students for a teacher
    getTeacherStudents: async (teacherId) => {
        try {
            const response = await chatAPI.get(`/TeacherStudents/${teacherId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting teacher students:', error);
            throw error.response?.data || error.message;
        }
    },

    // Delete a message
    deleteMessage: async (messageId, userId) => {
        try {
            const response = await chatAPI.delete('/MessageDelete', {
                data: { messageId, userId }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error.response?.data || error.message;
        }
    }
};

export default chatService;