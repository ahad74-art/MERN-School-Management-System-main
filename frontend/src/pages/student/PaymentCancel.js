import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: '16px', border: '1px solid #E2E8F0', background: '#fff', maxWidth: 480, width: '100%', textAlign: 'center' }}>
                <CancelIcon sx={{ fontSize: 72, color: '#DC2626', mb: 2 }} />
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B', mb: 1 }}>
                    Payment Cancelled
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mb: 3 }}>
                    Your payment was cancelled. No charges were made.
                </Typography>
                <Button fullWidth variant="contained"
                    onClick={() => navigate('/Student/fees')}
                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                    Back to Fees
                </Button>
            </Paper>
        </Box>
    );
};

export default PaymentCancel;
