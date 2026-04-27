import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) { setLoading(false); return; }

        fetch(`${process.env.REACT_APP_BASE_URL}/payment/verify-session?session_id=${sessionId}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) setDetails(data.payment);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [searchParams]);

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: '16px', border: '1px solid #E2E8F0', background: '#fff', maxWidth: 480, width: '100%', textAlign: 'center' }}>
                {loading ? (
                    <CircularProgress sx={{ color: '#1E3A8A' }} />
                ) : (
                    <>
                        <CheckCircleIcon sx={{ fontSize: 72, color: '#16A34A', mb: 2 }} />
                        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B', mb: 1 }}>
                            Payment Successful!
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: '#64748B', mb: 3 }}>
                            Your fee payment has been processed successfully.
                        </Typography>

                        {details && (
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', mb: 3, textAlign: 'left' }}>
                                {[
                                    ['Fee Type', details.feeStructure?.name],
                                    ['Amount Paid', `${details.currency} ${details.amount}`],
                                    ['Receipt No.', details.receiptNumber || 'Processing...'],
                                    ['Status', details.status],
                                ].map(([label, value]) => (
                                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography sx={{ fontSize: 13, color: '#64748B' }}>{label}</Typography>
                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{value}</Typography>
                                    </Box>
                                ))}
                            </Paper>
                        )}

                        <Button fullWidth variant="contained"
                            onClick={() => navigate('/Student/fees')}
                            sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                            Back to Fees
                        </Button>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default PaymentSuccess;
