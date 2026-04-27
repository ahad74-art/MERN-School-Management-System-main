import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    Divider,
    AppBar,
    Toolbar,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    ArrowBack as ArrowBackIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import socketService from '../../services/socketService';
import { chatService } from '../../services/chatAPI';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import OnlineIndicator from './OnlineIndicator';

const ChatWindow = ({ chat, currentUser, onBack }) => {
    // Get online status hook
    const { isUserOnline } = useOnlineStatus(socketService.getSocket());
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messageInputRef = useRef(null);

    // Load messages when chat changes
    useEffect(() => {
        if (chat?._id) {
            loadMessages(1, true);
            setupChatSocketListeners();
        }

        return () => {
            // Clean up listeners when chat changes
            socketService.removeListener('newMessage');
            socketService.removeListener('userTyping');
            socketService.removeListener('messagesRead');
        };
    }, [chat?._id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async (pageNum = 1, reset = false) => {
        if (!chat?._id) return;

        try {
            setLoading(pageNum === 1);
            
            const response = await chatService.getChatMessages(chat._id, pageNum, 50);
            
            if (reset) {
                setMessages(response.messages);
            } else {
                setMessages(prev => [...response.messages, ...prev]);
            }
            
            setHasMore(response.pagination.hasMore);
            setPage(pageNum);
            
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupChatSocketListeners = () => {
        // Listen for new messages in this chat
        socketService.onNewMessage((message) => {
            // Compare both as strings to handle ObjectId vs string mismatch
            const msgChatId = message.chat?._id || message.chat;
            if (msgChatId?.toString() === chat._id?.toString()) {
                setMessages(prev => {
                    // Prevent duplicate messages
                    const exists = prev.find(m => m._id === message._id);
                    if (exists) return prev;
                    return [...prev, message];
                });
                // Mark as read if message is from other user
                if (message.sender?._id !== currentUser._id && message.sender !== currentUser._id) {
                    socketService.markAsRead(chat._id);
                }
            }
        });

        // Listen for typing indicators
        socketService.onUserTyping((data) => {
            if (data.userId !== currentUser._id) {
                setTypingUsers(prev => {
                    if (data.isTyping) {
                        return [...prev.filter(u => u.userId !== data.userId), data];
                    } else {
                        return prev.filter(u => u.userId !== data.userId);
                    }
                });
            }
        });

        // Listen for read receipts
        socketService.onMessagesRead((data) => {
            if (data.chatId === chat._id && data.readBy !== currentUser._id) {
                setMessages(prev => 
                    prev.map(msg => ({
                        ...msg,
                        isRead: true,
                        readAt: data.readAt
                    }))
                );
            }
        });

        // Listen for deleted messages from other user
        if (socketService.getSocket()) {
            socketService.getSocket().on('messageDeleted', ({ messageId }) => {
                setMessages(prev => prev.filter(m => m._id !== messageId));
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await chatService.deleteMessage(messageId, currentUser._id);
            // Remove from local state immediately
            setMessages(prev => prev.filter(m => m._id !== messageId));
            // Also emit via socket so other user sees it removed
            if (socketService.getSocket()) {
                socketService.getSocket().emit('deleteMessage', { messageId, chatId: chat._id });
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            const messageData = {
                chatId: chat._id,
                senderId: currentUser._id,
                senderRole: currentUser.role,
                content: messageContent,
                messageType: 'text'
            };

            // Send via socket for real-time delivery
            socketService.sendMessage(messageData);
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Fallback to API if socket fails
            try {
                await chatService.sendMessage({
                    chatId: chat._id,
                    senderId: currentUser._id,
                    senderRole: currentUser.role,
                    content: messageContent
                });
            } catch (apiError) {
                console.error('API fallback also failed:', apiError);
                // Restore message in input
                setNewMessage(messageContent);
            }
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (event) => {
        setNewMessage(event.target.value);
        
        // Send typing indicator
        socketService.sendTyping(chat._id, true);
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            socketService.sendTyping(chat._id, false);
        }, 1000);
    };

    const getOtherUser = () => {
        if (currentUser.role === 'Student') {
            return chat.teacher;
        } else {
            return chat.student;
        }
    };

    const otherUser = getOtherUser();

    if (!chat) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography>No chat selected</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat Header */}
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{ minHeight: '64px !important' }}>
                    {onBack && (
                        <IconButton
                            edge="start"
                            onClick={onBack}
                            sx={{ mr: 2 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    
                    <Box sx={{ position: 'relative', mr: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                        {/* Online status indicator */}
                        <Box sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            right: 0,
                            zIndex: 1
                        }}>
                            <OnlineIndicator 
                                isOnline={isUserOnline(otherUser?._id)} 
                                size="small"
                            />
                        </Box>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="div">
                            {otherUser?.name || 'Unknown User'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {/* Online status text */}
                            <Typography 
                                variant="caption" 
                                color={isUserOnline(otherUser?._id) ? 'success.main' : 'text.secondary'}
                                sx={{ fontWeight: 500 }}
                            >
                                {isUserOnline(otherUser?._id) ? 'Active now' : 'Offline'}
                            </Typography>
                            
                            {currentUser.role === 'Teacher' && otherUser?.rollNum && (
                                <>
                                    <Typography variant="caption" color="text.secondary">•</Typography>
                                    <Chip
                                        label={`Roll: ${otherUser.rollNum}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </>
                            )}
                            
                            {otherUser?.email && (
                                <>
                                    <Typography variant="caption" color="text.secondary">•</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {otherUser.email}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>
                    
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <MessageList
                            messages={messages}
                            currentUser={currentUser}
                            onLoadMore={() => loadMessages(page + 1)}
                            hasMore={hasMore}
                            onDeleteMessage={handleDeleteMessage}
                        />
                        
                        {/* Typing Indicator */}
                        {typingUsers.length > 0 && (
                            <TypingIndicator users={typingUsers} />
                        )}
                        
                        <div ref={messagesEndRef} />
                    </>
                )}
            </Box>

            <Divider />

            {/* Message Input */}
            <Paper
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 1,
                    borderRadius: 0
                }}
            >
                <TextField
                    ref={messageInputRef}
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    variant="outlined"
                    size="small"
                />
                
                <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    sx={{ mb: 0.5 }}
                >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </Paper>
        </Box>
    );
};

export default ChatWindow;