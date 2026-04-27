import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { keyframes } from '@mui/system';

// Typing animation
const typingAnimation = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const TypingIndicator = ({ users }) => {
    if (!users || users.length === 0) {
        return null;
    }

    const user = users[0]; // Show only the first typing user for simplicity

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                mx: 1,
                mb: 1
            }}
        >
            <Avatar
                sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                    bgcolor: 'secondary.main'
                }}
            >
                {user.userName?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    border: 1,
                    borderColor: 'divider'
                }}
            >
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    {user.userName} is typing
                </Typography>
                
                <Box
                    component="span"
                    sx={{
                        display: 'inline-flex',
                        gap: 0.5
                    }}
                >
                    {[0, 1, 2].map((index) => (
                        <Box
                            key={index}
                            sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: 'text.secondary',
                                animation: `${typingAnimation} 1.4s infinite`,
                                animationDelay: `${index * 0.2}s`
                            }}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default TypingIndicator;