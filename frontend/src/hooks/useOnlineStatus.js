import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

/**
 * Custom hook to track online/offline status of users
 * Integrates with Socket.IO to receive real-time status updates
 * 
 * @param {Object} socket - Socket.IO client instance
 * @returns {Object} - { onlineUsers: Set, isUserOnline: Function }
 */
const useOnlineStatus = (socket) => {
    // Store online user IDs in a Set for O(1) lookup
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        if (!socket) return;

        // ============================================
        // LISTEN FOR USER ONLINE EVENTS
        // ============================================
        const handleUserOnline = (data) => {
            const { userId } = data;
            console.log(`User ${userId} came online`);
            
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(userId);
                return newSet;
            });
        };

        // ============================================
        // LISTEN FOR USER OFFLINE EVENTS
        // ============================================
        const handleUserOffline = (data) => {
            const { userId } = data;
            console.log(`User ${userId} went offline`);
            
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        };

        // ============================================
        // LISTEN FOR INITIAL ONLINE USERS LIST
        // ============================================
        const handleConnected = (data) => {
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                setOnlineUsers(new Set(data.onlineUsers));
                console.log('Received online users list:', data.onlineUsers);
            }
        };

        // ============================================
        // LISTEN FOR ONLINE STATUS RESPONSE
        // ============================================
        const handleOnlineStatusResponse = (statusMap) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                Object.entries(statusMap).forEach(([userId, isOnline]) => {
                    if (isOnline) {
                        newSet.add(userId);
                    } else {
                        newSet.delete(userId);
                    }
                });
                return newSet;
            });
        };

        // Register event listeners
        socket.on('user-online', handleUserOnline);
        socket.on('user-offline', handleUserOffline);
        socket.on('connected', handleConnected);
        socket.on('onlineStatusResponse', handleOnlineStatusResponse);

        // Cleanup on unmount
        return () => {
            socket.off('user-online', handleUserOnline);
            socket.off('user-offline', handleUserOffline);
            socket.off('connected', handleConnected);
            socket.off('onlineStatusResponse', handleOnlineStatusResponse);
        };
    }, [socket]);

    /**
     * Check if a specific user is online
     * @param {string} userId - The user ID to check
     * @returns {boolean} - True if user is online
     */
    const isUserOnline = (userId) => {
        // Don't show current user as online to themselves
        if (userId === currentUser?._id) return false;
        return onlineUsers.has(userId);
    };

    /**
     * Request online status for specific users
     * Useful when loading a chat list
     * @param {Array} userIds - Array of user IDs to check
     */
    const checkOnlineStatus = (userIds) => {
        if (socket && userIds && userIds.length > 0) {
            socket.emit('checkOnlineStatus', userIds);
        }
    };

    return {
        onlineUsers,
        isUserOnline,
        checkOnlineStatus
    };
};

export default useOnlineStatus;
