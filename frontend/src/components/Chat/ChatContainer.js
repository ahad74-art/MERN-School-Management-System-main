import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { useSelector } from 'react-redux';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import UserList from './UserList';
import socketService from '../../services/socketService';
import { chatService } from '../../services/chatAPI';

const ChatContainer = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const { currentUser } = useSelector((state) => state.user);
    
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showUserList, setShowUserList] = useState(false);

    // Initialize socket connection and load data
    useEffect(() => {
        if (currentUser && currentUser._id) {
            initializeChat();
        }

        return () => {
            // Cleanup socket connection
            socketService.disconnect();
        };
    }, [currentUser]);

    const initializeChat = async () => {
        try {
            setLoading(true);
            
            // Connect to socket
            const userData = {
                userId: currentUser._id,
                userRole: currentUser.role,
                userName: currentUser.name
            };
            
            socketService.connect(userData);
            
            // Load user chats
            await loadUserChats();
            
            // Load available users to chat with
            await loadAvailableUsers();
            
            // Setup socket listeners
            setupSocketListeners();
            
        } catch (error) {
            console.error('Error initializing chat:', error);
            setError('Failed to initialize chat system');
        } finally {
            setLoading(false);
        }
    };

    const loadUserChats = async () => {
        try {
            const userChats = await chatService.getUserChats(currentUser._id, currentUser.role);
            setChats(userChats);
        } catch (error) {
            console.error('Error loading chats:', error);
            setError('Failed to load chats');
        }
    };

    const loadAvailableUsers = async () => {
        try {
            let users = [];
            if (currentUser.role === 'Student') {
                users = await chatService.getAvailableTeachers(currentUser._id);
            } else if (currentUser.role === 'Teacher') {
                users = await chatService.getTeacherStudents(currentUser._id);
            }
            setAvailableUsers(users);
        } catch (error) {
            console.error('Error loading available users:', error);
        }
    };

    const setupSocketListeners = () => {
        // Listen for new messages
        socketService.onNewMessage((message) => {
            console.log('New message received:', message);
            
            // Update chat list with new message
            setChats(prevChats => {
                return prevChats.map(chat => {
                    if (chat._id === message.chat) {
                        return {
                            ...chat,
                            lastMessage: message,
                            lastMessageTime: message.createdAt
                        };
                    }
                    return chat;
                });
            });
        });

        // Listen for message notifications
        socketService.onMessageNotification((notification) => {
            console.log('Message notification:', notification);
            
            // You can show a toast notification here
            // For now, we'll just update the chat list
            loadUserChats();
        });

        // Listen for errors
        socketService.onError((error) => {
            console.error('Socket error:', error);
            setError(error.error || 'Socket connection error');
        });
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        
        // Join the chat room
        socketService.joinChat(chat._id);
        
        // Mark messages as read
        socketService.markAsRead(chat._id);
        
        // Hide user list on mobile after selection
        if (isMobile) {
            setShowUserList(false);
        }
    };

    const handleNewChat = async (user) => {
        try {
            let chat;
            
            if (currentUser.role === 'Student') {
                // Student starting chat with teacher
                chat = await chatService.getOrCreateChat(currentUser._id, user._id);
            } else {
                // Teacher starting chat with student
                chat = await chatService.getOrCreateChat(user._id, currentUser._id);
            }
            
            // Add to chats list if not already present
            setChats(prevChats => {
                const exists = prevChats.find(c => c._id === chat._id);
                if (!exists) {
                    return [chat, ...prevChats];
                }
                return prevChats;
            });
            
            // Select the new chat
            handleChatSelect(chat);
            
        } catch (error) {
            console.error('Error creating new chat:', error);
            setError('Failed to start new chat');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <Typography>Loading chat system...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '80vh', display: 'flex', bgcolor: 'background.default' }}>
            {/* Chat List Panel */}
            <Paper 
                sx={{ 
                    width: isMobile ? (showUserList ? '100%' : '100%') : '350px',
                    display: isMobile && selectedChat && !showUserList ? 'none' : 'flex',
                    flexDirection: 'column',
                    borderRadius: 0,
                    borderRight: 1,
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" component="h2">
                        Messages
                    </Typography>
                </Box>
                
                <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    onChatSelect={handleChatSelect}
                    currentUser={currentUser}
                    socket={socketService.getSocket()}
                />
                
                <Divider />
                
                <UserList
                    users={availableUsers}
                    onUserSelect={handleNewChat}
                    currentUser={currentUser}
                    title={currentUser.role === 'Student' ? 'Teachers' : 'Students'}
                />
            </Paper>

            {/* Chat Window */}
            <Box sx={{ 
                flex: 1, 
                display: isMobile && !selectedChat ? 'none' : 'flex',
                flexDirection: 'column'
            }}>
                {selectedChat ? (
                    <ChatWindow
                        chat={selectedChat}
                        currentUser={currentUser}
                        onBack={isMobile ? () => setSelectedChat(null) : null}
                    />
                ) : (
                    <Box 
                        display="flex" 
                        justifyContent="center" 
                        alignItems="center" 
                        height="100%"
                        sx={{ bgcolor: 'background.paper' }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Select a chat to start messaging
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChatContainer;