import React from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Badge,
    Box,
    Chip
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import OnlineIndicator from './OnlineIndicator';

const ChatList = ({ chats, selectedChat, onChatSelect, currentUser, socket }) => {
    // Get online status hook
    const { isUserOnline } = useOnlineStatus(socket);
    
    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (error) {
            return '';
        }
    };

    const getOtherUser = (chat) => {
        if (currentUser.role === 'Student') {
            return chat.teacher;
        } else {
            return chat.student;
        }
    };

    const getUnreadCount = (chat) => {
        if (currentUser.role === 'Student') {
            return chat.unreadCount?.student || 0;
        } else {
            return chat.unreadCount?.teacher || 0;
        }
    };

    const getLastMessagePreview = (chat) => {
        if (!chat.lastMessage) {
            return 'No messages yet';
        }
        
        const content = chat.lastMessage.content;
        return content.length > 50 ? content.substring(0, 50) + '...' : content;
    };

    if (!chats || chats.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    No conversations yet
                </Typography>
            </Box>
        );
    }

    return (
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {chats.map((chat) => {
                const otherUser = getOtherUser(chat);
                const unreadCount = getUnreadCount(chat);
                const isSelected = selectedChat?._id === chat._id;
                
                return (
                    <ListItem key={chat._id} disablePadding>
                        <ListItemButton
                            selected={isSelected}
                            onClick={() => onChatSelect(chat)}
                            sx={{
                                py: 1.5,
                                px: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.light',
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                    },
                                },
                            }}
                        >
                            <ListItemAvatar>
                                <Box sx={{ position: 'relative' }}>
                                    <Badge
                                        badgeContent={unreadCount}
                                        color="error"
                                        invisible={unreadCount === 0}
                                    >
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Avatar>
                                    </Badge>
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
                            </ListItemAvatar>
                            
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                                                flex: 1
                                            }}
                                        >
                                            {otherUser?.name || 'Unknown User'}
                                        </Typography>
                                        
                                        {currentUser.role === 'Teacher' && (
                                            <Chip
                                                label={`Roll: ${otherUser?.rollNum || 'N/A'}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem', height: '20px' }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                fontWeight: unreadCount > 0 ? 'medium' : 'normal',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {getLastMessagePreview(chat)}
                                        </Typography>
                                        
                                        {chat.lastMessageTime && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ fontSize: '0.7rem' }}
                                            >
                                                {formatLastMessageTime(chat.lastMessageTime)}
                                            </Typography>
                                        )}
                                    </Box>
                                }
                            />
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
};

export default ChatList;