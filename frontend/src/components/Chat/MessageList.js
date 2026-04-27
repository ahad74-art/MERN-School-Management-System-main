import React, { useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    IconButton,
    Tooltip,
    Button
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Done as DoneIcon,
    DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const MessageList = ({ messages, currentUser, onLoadMore, hasMore, onDeleteMessage }) => {
    const messagesContainerRef = useRef(null);
    const prevScrollHeight = useRef(0);

    // Handle scroll for loading more messages
    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container && container.scrollTop === 0 && hasMore) {
            prevScrollHeight.current = container.scrollHeight;
            onLoadMore();
        }
    };

    // Maintain scroll position when loading more messages
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container && prevScrollHeight.current > 0) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight.current;
            prevScrollHeight.current = 0;
        }
    }, [messages]);

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return `Yesterday ${format(date, 'HH:mm')}`;
        } else {
            return format(date, 'MMM dd, HH:mm');
        }
    };

    const shouldShowDateSeparator = (currentMessage, previousMessage) => {
        if (!previousMessage) return true;
        
        const currentDate = new Date(currentMessage.createdAt);
        const previousDate = new Date(previousMessage.createdAt);
        
        return !isSameDay(currentDate, previousDate);
    };

    const formatDateSeparator = (timestamp) => {
        const date = new Date(timestamp);
        
        if (isToday(date)) {
            return 'Today';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMMM dd, yyyy');
        }
    };

    const isOwnMessage = (message) => {
        return message.sender._id === currentUser._id;
    };

    const getMessageStatus = (message) => {
        if (!isOwnMessage(message)) return null;
        
        if (message.isRead) {
            return <DoneAllIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
        } else {
            return <DoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
        }
    };

    if (!messages || messages.length === 0) {
        return (
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 3
                }}
            >
                <Typography variant="body1" color="text.secondary">
                    No messages yet. Start the conversation!
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            ref={messagesContainerRef}
            onScroll={handleScroll}
            sx={{
                flex: 1,
                overflow: 'auto',
                p: 1,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Load More Button */}
            {hasMore && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onLoadMore}
                    >
                        Load More Messages
                    </Button>
                </Box>
            )}

            {messages.map((message, index) => {
                const isOwn = isOwnMessage(message);
                const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);
                
                return (
                    <React.Fragment key={message._id}>
                        {/* Date Separator */}
                        {showDateSeparator && (
                            <Box sx={{ textAlign: 'center', my: 2 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        bgcolor: 'background.paper',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 1,
                                        border: 1,
                                        borderColor: 'divider'
                                    }}
                                >
                                    {formatDateSeparator(message.createdAt)}
                                </Typography>
                            </Box>
                        )}

                        {/* Message */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                mb: 1,
                                alignItems: 'flex-end'
                            }}
                        >
                            {/* Other user's avatar */}
                            {!isOwn && (
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        mr: 1,
                                        bgcolor: 'secondary.main'
                                    }}
                                >
                                    {message.sender.name?.charAt(0)?.toUpperCase() || '?'}
                                </Avatar>
                            )}

                            {/* Message Content */}
                            <Paper
                                sx={{
                                    maxWidth: '70%',
                                    p: 1.5,
                                    bgcolor: isOwn ? 'primary.main' : 'background.paper',
                                    color: isOwn ? 'primary.contrastText' : 'text.primary',
                                    borderRadius: 2,
                                    borderBottomRightRadius: isOwn ? 0.5 : 2,
                                    borderBottomLeftRadius: isOwn ? 2 : 0.5,
                                    position: 'relative',
                                    '&:hover .message-actions': {
                                        opacity: 1
                                    }
                                }}
                            >
                                {/* Sender name for group context */}
                                {!isOwn && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            fontWeight: 'bold',
                                            mb: 0.5,
                                            color: 'primary.main'
                                        }}
                                    >
                                        {message.sender.name}
                                    </Typography>
                                )}

                                {/* Message text */}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {message.content}
                                </Typography>

                                {/* Message time and status */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        mt: 0.5
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.7rem',
                                            opacity: 0.8
                                        }}
                                    >
                                        {formatMessageTime(message.createdAt)}
                                    </Typography>
                                    
                                    {getMessageStatus(message)}
                                </Box>

                                {/* Message Actions */}
                                <Box
                                    className="message-actions"
                                    sx={{
                                        position: 'absolute',
                                        top: -10,
                                        right: isOwn ? -40 : 'auto',
                                        left: isOwn ? 'auto' : -40,
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        bgcolor: 'background.paper',
                                        borderRadius: 1,
                                        boxShadow: 1
                                    }}
                                >
                                    {isOwn && (
                                        <Tooltip title="Delete message">
                                            <IconButton
                                                size="small"
                                                onClick={() => onDeleteMessage && onDeleteMessage(message._id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Paper>

                            {/* Own user's avatar */}
                            {isOwn && (
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        ml: 1,
                                        bgcolor: 'primary.main'
                                    }}
                                >
                                    {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                                </Avatar>
                            )}
                        </Box>
                    </React.Fragment>
                );
            })}
        </Box>
    );
};

export default MessageList;