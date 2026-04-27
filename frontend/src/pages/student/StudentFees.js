import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Alert, Snackbar, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
    Payment as PaymentIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

const StudentFees = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [feeDetails, setFeeDetails] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchFeeDetails();
        fetchPaymentHistory();
    }, []);

    const fetchFeeDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/payment/student/${currentUser._id}/fees`);
            const data = await response.json();
            if (data.success) setFeeDetails(data.summary);
            else showSnackbar('Error fetching fee details', 'error');
        } catch (error) {
            console.error('Error fetching fee details:', error);
            showSnackbar('Error fetching fee details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/payment/student/${currentUser._id}/history?limit=10`);
            const data = await response.json();
            if (data.success) setPaymentHistory(data.payments);
        } catch (error) {
            console.error('Error fetching payment history:', error);
        }
    };

    const handlePaymentClick = async (fee) => {
        try {
            const feeStructureId = fee.feeStructure?._id || fee.feeStructure?.id;
            if (!feeStructureId) {
                showSnackbar('Fee structure information is missing', 'error');
                return;
            }
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/payment/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: currentUser._id,
                    feeStructureId,
                    amount: fee.pendingAmount,
                    currency: 'usd',
                }),
            });
            const data = await res.json();
            if (data.success && data.url) {
                window.location.href = data.url;
            } else {
                showSnackbar(data.message || 'Failed to start payment', 'error');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showSnackbar('Error starting payment', 'error');
        }
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    const getStatusColor = (status) => {
        switch (status) {
            case 'fully_paid': return 'success';
            case 'partially_paid': return 'warning';
            case 'overdue': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'fully_paid': return <CheckCircleIcon color="success" />;
            case 'overdue': return <WarningIcon color="error" />;
            default: return <ScheduleIcon color="action" />;
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount);

    const downloadReceipt = async (paymentId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/payment/receipt/${paymentId}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${paymentId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                showSnackbar('Error downloading receipt', 'error');
            }
        } catch (error) {
            showSnackbar('Error downloading receipt', 'error');
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                <LinearProgress sx={{ borderRadius: 4 }} />
                <Typography sx={{ mt: 2, color: '#64748B' }}>Loading fee details...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>My Fees</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>Track your fee payments and history</Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Fees', value: feeDetails?.totalFees || 0, color: '#1E3A8A' },
                    { label: 'Paid Amount', value: feeDetails?.totalPaid || 0, color: '#16A34A' },
                    { label: 'Pending Amount', value: feeDetails?.totalPending || 0, color: '#D97706' },
                    { label: 'Overdue Amount', value: feeDetails?.totalOverdue || 0, color: '#DC2626' },
                ].map(({ label, value, color }) => (
                    <Grid item xs={12} md={3} key={label}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                            <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 500, mb: 1 }}>{label}</Typography>
                            <Typography sx={{ fontSize: 24, fontWeight: 700, color }}>{formatCurrency(value)}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Fee Details Table */}
            <Paper elevation={0} sx={{ mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <Box sx={{ p: 3, pb: 1 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>Fee Details</Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: '#1E293B' }}>
                                {['Fee Type', 'Total Amount', 'Paid Amount', 'Pending Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {feeDetails?.fees?.map((fee) => (
                                <TableRow key={fee.id} sx={{ '&:hover': { background: '#F8FAFC' }, '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getStatusIcon(fee.status)}
                                            <Box>
                                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{fee.feeStructure?.name || 'N/A'}</Typography>
                                                <Typography sx={{ fontSize: 11, color: '#64748B' }}>{fee.feeStructure?.feeType || ''}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 13, color: '#1E293B' }}>{formatCurrency(fee.totalAmount)}</TableCell>
                                    <TableCell sx={{ fontSize: 13, color: '#16A34A', fontWeight: 500 }}>{formatCurrency(fee.paidAmount)}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 13, color: fee.pendingAmount > 0 ? '#DC2626' : '#16A34A', fontWeight: 500 }}>
                                            {formatCurrency(fee.pendingAmount)}
                                        </Typography>
                                        {fee.lateFeeAmount > 0 && (
                                            <Typography sx={{ fontSize: 11, color: '#DC2626' }}>
                                                + {formatCurrency(fee.lateFeeAmount)} late fee
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 13, color: '#475569' }}>{new Date(fee.dueDate).toLocaleDateString()}</Typography>
                                        {fee.isOverdue && (
                                            <Typography sx={{ fontSize: 11, color: '#DC2626' }}>{fee.daysOverdue} days overdue</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={(fee.status || 'pending').replace('_', ' ').toUpperCase()} color={getStatusColor(fee.status)} size="small"
                                            sx={{ fontSize: 11, borderRadius: '6px' }} />
                                    </TableCell>
                                    <TableCell>
                                        {fee.pendingAmount > 0 && (
                                            <Button variant="contained" size="small" startIcon={<PaymentIcon />}
                                                onClick={() => handlePaymentClick(fee)}
                                                sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', fontSize: 12 }}>
                                                Pay Now
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Payment History */}
            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <Box sx={{ p: 3, pb: 1 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>Recent Payment History</Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: '#1E293B' }}>
                                {['Payment ID', 'Fee Type', 'Amount', 'Payment Date', 'Status', 'Receipt'].map(h => (
                                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paymentHistory.map((payment) => (
                                <TableRow key={payment.paymentId} sx={{ '&:hover': { background: '#F8FAFC' }, '&:last-child td': { border: 0 } }}>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: '#475569' }}>{payment.paymentId}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 13, color: '#1E293B' }}>{payment.feeStructure?.name || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell sx={{ fontSize: 13, color: '#475569' }}>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip label={(payment.status || 'pending').toUpperCase()} color={getStatusColor(payment.status)} size="small"
                                            sx={{ fontSize: 11, borderRadius: '6px' }} />
                                    </TableCell>
                                    <TableCell>
                                        {payment.status === 'completed' && payment.receiptNumber && (
                                            <Tooltip title="Download Receipt">
                                                <IconButton size="small" onClick={() => downloadReceipt(payment.paymentId)}
                                                    sx={{ color: '#1E3A8A' }}>
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StudentFees;
