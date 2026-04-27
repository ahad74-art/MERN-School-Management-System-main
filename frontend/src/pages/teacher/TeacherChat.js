import React from 'react';
import { Box, Typography } from '@mui/material';
import ChatContainer from '../../components/Chat/ChatContainer';

const TeacherChat = () => {
    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>Messages</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                    Communicate with your students to provide support and answer their questions
                </Typography>
            </Box>
            <ChatContainer />
        </Box>
    );
};

export default TeacherChat;
