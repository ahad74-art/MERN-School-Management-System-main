import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) { setLoading(false); return; }

        // Poll up to 5 times to wait for webhook to complete the payment
        let attempts = 0;
        const poll = () => {
            fetch(`${process.env.REACT_APP_BASE_URL}/payment/verify-session?session_id=${sessionId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        setDetails(data.payment);
                        setLoading(false);
                    } else if (attempts < 5) {
                        attempts++;
                        setTimeout(poll, 1500);
                    } else {
                        setLoading(false);
                    }
                })
                .catch(() => setLoading(false));
        };
        poll();
    }, [searchParams]);

    const downloadReceipt = async () => {
        if (!details?.paymentId) return;
        setDownloading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/payment/receipt/${details.paymentId}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `challan-receipt-${details.receiptNumber || details.paymentId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('Receipt download failed:', err);
        } finally {
            setDownloading(false);
        }
    };

    const formatCurrency = (amount, currency) => {
        try {
            return new Intl.NumberFormat('en-PK', { style: 'currency', currency: currency || 'PKR' }).format(amount);
        } catch {
            return `${currency || 'PKR'} ${amount}`;
        }
    };

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: '16px', border: '1px solid #E2E8F0', background: '#fff', maxWidth: 500, width: '100%', textAlign: 'center' }}>
                {loading ? (
                    <Box>
                        <CircularProgress sx={{ color: '#1E3A8A', mb: 2 }} />
                        <Typography sx={{ fontSize: 14, color: '#64748B' }}>Confirming your payment...</Typography>
                    </Box>
                ) : (
                    <>
                        {/* Success icon */}
                        <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                            <CheckCircleIcon sx={{ fontSize: 52, color: '#16A34A' }} />
                        </Box>

                        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
                            Payment Successful!
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: '#64748B', mb: 3 }}>
                            Your fee payment has been processed and recorded.
                        </Typography>

                        {/* Challan / Receipt card */}
                        {details && (
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '2px solid #E2E8F0', overflow: 'hidden', mb: 3, textAlign: 'left' }}>
                                {/* Receipt header */}
                                <Box sx={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <ReceiptIcon sx={{ color: '#fff', fontSize: 22 }} />
                                    <Box>
                                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Fee Payment Challan</Typography>
                                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>School Management System</Typography>
                                    </Box>
                                </Box>

                                {/* Receipt body */}
                                <Box sx={{ px: 3, py: 2.5 }}>
                                    {[
                                        { label: 'Student Name', value: details.student?.name || 'N/A' },
                                        { label: 'Roll Number', value: details.student?.rollNum || 'N/A' },
                                        { label: 'Fee Type', value: details.feeStructure?.name || 'N/A' },
                                        { label: 'Amount Paid', value: formatCurrency(details.amount, details.currency), highlight: true },
                                        { label: 'Payment Method', value: 'Stripe (Online)', badge: true },
                                        { label: 'Receipt No.', value: details.receiptNumber || 'Processing...', mono: true },
                                        { label: 'Date', value: details.completedAt ? new Date(details.completedAt).toLocaleString() : new Date().toLocaleString() },
                                        { label: 'Status', value: 'PAID', status: true },
                                    ].map(({ label, value, highlight, mono, status, badge }) => (
                                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, borderBottom: '1px solid #F1F5F9' }}>
                                            <Typography sx={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{label}</Typography>
                                            {status ? (
                                                <Box sx={{ px: 1.5, py: 0.3, borderRadius: '20px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>✓ {value}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography sx={{
                                                    fontSize: 13,
                                                    fontWeight: highlight || status ? 700 : 600,
                                                    color: highlight ? '#1E3A8A' : '#1E293B',
                                                    fontFamily: mono ? 'monospace' : 'inherit',
                                                }}>
                                                    {value}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        )}

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {details?.receiptNumber && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                    onClick={downloadReceipt}
                                    disabled={downloading}
                                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 1.2 }}
                                >
                                    {downloading ? 'Downloading...' : 'Download Challan Receipt (PDF)'}
                                </Button>
                            )}
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => navigate('/Student/fees')}
                                sx={{ borderColor: '#E2E8F0', color: '#64748B', borderRadius: '8px', textTransform: 'none' }}
                            >
                                Back to My Fees
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default PaymentSuccess;
