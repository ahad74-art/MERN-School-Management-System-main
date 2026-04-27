import React, { useState } from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Box,
    Collapse,
    IconButton,
    Chip
} from '@mui/material';
import {
    ExpandLess,
    ExpandMore,
    Person as PersonIcon
} from '@mui/icons-material';

const UserList = ({ users, onUserSelect, currentUser, title }) => {
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    if (!users || users.length === 0) {
        return null;
    }

    return (
        <Box>
            <ListItem disablePadding>
                <ListItemButton onClick={handleToggle}>
                    <ListItemText
                        primary={
                            <Typography variant="subtitle2" color="primary">
                                {title} ({users.length})
                            </Typography>
                        }
                    />
                    <IconButton size="small">
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </ListItemButton>
            </ListItem>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {users.map((user) => (
                        <ListItem key={user._id} disablePadding>
                            <ListItemButton
                                onClick={() => onUserSelect(user)}
                                sx={{ pl: 4 }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                        <PersonIcon fontSize="small" />
                                    </Avatar>
                                </ListItemAvatar>
                                
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2">
                                                {user.name}
                                            </Typography>
                                            
                                            {user.rollNum && (
                                                <Chip
                                                    label={`Roll: ${user.rollNum}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: '18px' }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {user.email || 'No email'}
                                            {user.subject && ` • ${user.subject}`}
                                            {user.sclassName?.sclassName && ` • Class: ${user.sclassName.sclassName}`}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Collapse>
        </Box>
    );
};

export default UserList;