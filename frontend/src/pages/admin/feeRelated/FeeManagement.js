import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    LinearProgress,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    Menu,
    ListItemIcon,
    ListItemText,
    Divider,
    Switch,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Payment as PaymentIcon,
    Receipt as ReceiptIcon,
    Analytics as AnalyticsIcon,
    Download as DownloadIcon,
    MoreVert as MoreVertIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const FeeManagement = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fee Structures State
    const [feeStructures, setFeeStructures] = useState([]);
    const [feeStructureDialog, setFeeStructureDialog] = useState(false);
    const [selectedFeeStructure, setSelectedFeeStructure] = useState(null);

    // Payments State
    const [payments, setPayments] = useState([]);
    const [pendingFees, setPendingFees] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        academicYear: '2024-2025',
        feeType: '',
        status: '',
        dateFrom: null,
        dateTo: null
    });

    useEffect(() => {
        fetchFeeStructures();
        fetchPayments();
        fetchPendingFees();
        fetchAnalytics();
    }, [filters]);

    const fetchFeeStructures = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.academicYear) queryParams.append('academicYear', filters.academicYear);
            if (filters.feeType) queryParams.append('feeType', filters.feeType);

            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/fee/structures/${currentUser._id}?${queryParams}`
            );
            const data = await response.json();
            
            if (data.success) {
                setFeeStructures(data.feeStructures);
            } else {
                showSnackbar('Error fetching fee structures', 'error');
            }
        } catch (error) {
            console.error('Error fetching fee structures:', error);
            showSnackbar('Error fetching fee structures', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString());
            if (filters.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString());

            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/payment/school/${currentUser._id}/all?${queryParams}`
            );
            const data = await response.json();
            
            if (data.success) {
                setPayments(data.payments);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const fetchPendingFees = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/payment/school/${currentUser._id}/pending`
            );
            const data = await response.json();
            
            if (data.success) {
                setPendingFees(data.pendingFees);
            }
        } catch (error) {
            console.error('Error fetching pending fees:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (filters.academicYear) queryParams.append('academicYear', filters.academicYear);

            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/payment/school/${currentUser._id}/analytics?${queryParams}`
            );
            const data = await response.json();
            
            if (data.success) {
                setAnalytics(data.analytics);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
            case 'fully_paid': return 'success';
            case 'partially_paid':
            case 'pending': return 'warning';
            case 'overdue':
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleCreateFeeStructure = () => {
        setSelectedFeeStructure(null);
        setFeeStructureDialog(true);
    };

    const handleEditFeeStructure = (feeStructure) => {
        setSelectedFeeStructure(feeStructure);
        setFeeStructureDialog(true);
    };

    const handleDeleteFeeStructure = async (feeStructureId) => {
        if (!window.confirm('Are you sure you want to delete this fee structure?')) {
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/fee/structure/${feeStructureId}`,
                { method: 'DELETE' }
            );
            const data = await response.json();
            
            if (data.success) {
                showSnackbar('Fee structure deleted successfully', 'success');
                fetchFeeStructures();
            } else {
                showSnackbar(data.message || 'Error deleting fee structure', 'error');
            }
        } catch (error) {
            console.error('Error deleting fee structure:', error);
            showSnackbar('Error deleting fee structure', 'error');
        }
    };

    const exportPaymentData = async (format = 'csv') => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('format', format);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString());
            if (filters.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString());

            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/payment/school/${currentUser._id}/export?${queryParams}`
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payments-${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showSnackbar('Payment data exported successfully', 'success');
            } else {
                showSnackbar('Error exporting payment data', 'error');
            }
        } catch (error) {
            console.error('Error exporting payment data:', error);
            showSnackbar('Error exporting payment data', 'error');
        }
    };

    return (
        // <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Fee Management
                </Typography>

                {/* Analytics Cards */}
                {analytics && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Collected
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {formatCurrency(analytics.overall.completedAmount || 0)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {analytics.overall.completedPayments || 0} payments
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Outstanding Amount
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {formatCurrency(analytics.outstanding.totalOutstanding || 0)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Pending collection
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Overdue Amount
                                    </Typography>
                                    <Typography variant="h4" color="error.main">
                                        {formatCurrency(analytics.outstanding.totalOverdue || 0)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {analytics.outstanding.overdueCount || 0} students
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Failed Payments
                                    </Typography>
                                    <Typography variant="h4" color="error.main">
                                        {analytics.overall.failedPayments || 0}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Need attention
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange}>
                        <Tab label="Fee Structures" />
                        <Tab label="Payments" />
                        <Tab label="Pending Fees" />
                        <Tab label="Analytics" />
                    </Tabs>
                </Paper>

                {/* Tab Content */}
                {activeTab === 0 && (
                    <FeeStructuresTab
                        feeStructures={feeStructures}
                        loading={loading}
                        onCreateFeeStructure={handleCreateFeeStructure}
                        onEditFeeStructure={handleEditFeeStructure}
                        onDeleteFeeStructure={handleDeleteFeeStructure}
                        formatCurrency={formatCurrency}
                    />
                )}

                {activeTab === 1 && (
                    <PaymentsTab
                        payments={payments}
                        loading={loading}
                        filters={filters}
                        setFilters={setFilters}
                        onExportData={exportPaymentData}
                        formatCurrency={formatCurrency}
                        getStatusColor={getStatusColor}
                    />
                )}

                {activeTab === 2 && (
                    <PendingFeesTab
                        pendingFees={pendingFees}
                        loading={loading}
                        onRefresh={fetchPendingFees}
                        formatCurrency={formatCurrency}
                        getStatusColor={getStatusColor}
                        showSnackbar={showSnackbar}
                    />
                )}

                {activeTab === 3 && (
                    <AnalyticsTab
                        analytics={analytics}
                        loading={loading}
                        formatCurrency={formatCurrency}
                    />
                )}

                {/* Fee Structure Dialog */}
                <FeeStructureDialog
                    open={feeStructureDialog}
                    onClose={() => setFeeStructureDialog(false)}
                    feeStructure={selectedFeeStructure}
                    onSave={() => {
                        setFeeStructureDialog(false);
                        fetchFeeStructures();
                        showSnackbar(
                            selectedFeeStructure ? 'Fee structure updated successfully' : 'Fee structure created successfully',
                            'success'
                        );
                    }}
                    showSnackbar={showSnackbar}
                />

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        // </LocalizationProvider>
    );
};

// Fee Structures Tab Component
const FeeStructuresTab = ({ 
    feeStructures, 
    loading, 
    onCreateFeeStructure, 
    onEditFeeStructure, 
    onDeleteFeeStructure,
    formatCurrency 
}) => {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedStructure, setSelectedStructure] = useState(null);

    const handleMenuClick = (event, structure) => {
        setMenuAnchor(event.currentTarget);
        setSelectedStructure(structure);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedStructure(null);
    };

    return (
        <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Fee Structures</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreateFeeStructure}
                >
                    Create Fee Structure
                </Button>
            </Box>
            
            {loading ? (
                <LinearProgress />
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Class</TableCell>
                                <TableCell>Fee Type</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {feeStructures.map((structure) => (
                                <TableRow key={structure._id}>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {structure.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {structure.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{structure.sclass?.sclassName}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={structure.feeType} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{formatCurrency(structure.amount)}</TableCell>
                                    <TableCell>
                                        {new Date(structure.dueDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={structure.isActive ? 'Active' : 'Inactive'}
                                            color={structure.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleMenuClick(e, structure)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    onEditFeeStructure(selectedStructure);
                    handleMenuClose();
                }}>
                    <ListItemIcon><EditIcon /></ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    onDeleteFeeStructure(selectedStructure._id);
                    handleMenuClose();
                }}>
                    <ListItemIcon><DeleteIcon /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Paper>
    );
};

// Payments Tab Component
const PaymentsTab = ({ 
    payments, 
    loading, 
    filters, 
    setFilters, 
    onExportData, 
    formatCurrency, 
    getStatusColor 
}) => {
    return (
        <Paper>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Payment History</Typography>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => onExportData('csv')}
                    >
                        Export CSV
                    </Button>
                </Box>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="From Date"
                            type="date"
                            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : null })}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="To Date"
                            type="date"
                            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value ? new Date(e.target.value) : null })}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Box>

            {loading ? (
                <LinearProgress />
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Payment ID</TableCell>
                                <TableCell>Student</TableCell>
                                <TableCell>Fee Type</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Payment Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Receipt</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.paymentId}>
                                    <TableCell>
                                        <Typography variant="body2" fontFamily="monospace">
                                            {payment.paymentId}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {payment.student.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {payment.student.rollNum}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{payment.feeStructure.name}</TableCell>
                                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell>
                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={payment.status.toUpperCase()}
                                            color={getStatusColor(payment.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {payment.receiptNumber && (
                                            <Tooltip title="Download Receipt">
                                                <IconButton size="small">
                                                    <ReceiptIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};

// Pending Fees Tab Component
const PendingFeesTab = ({ 
    pendingFees, 
    loading, 
    onRefresh, 
    formatCurrency, 
    getStatusColor, 
    showSnackbar 
}) => {
    const markAsPaid = async (studentFeeId, amount) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/payment/manual/${studentFeeId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, paymentMethod: 'cash' })
                }
            );
            const data = await response.json();
            
            if (data.success) {
                showSnackbar('Payment recorded successfully', 'success');
                onRefresh();
            } else {
                showSnackbar(data.message || 'Error recording payment', 'error');
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            showSnackbar('Error recording payment', 'error');
        }
    };

    return (
        <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Pending Fees</Typography>
                <Button variant="outlined" onClick={onRefresh}>
                    Refresh
                </Button>
            </Box>

            {loading ? (
                <LinearProgress />
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student</TableCell>
                                <TableCell>Fee Type</TableCell>
                                <TableCell>Total Amount</TableCell>
                                <TableCell>Pending Amount</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pendingFees.map((fee) => (
                                <TableRow key={fee.id}>
                                    <TableCell>
                                        <Typography variant="subtitle2">
                                            {fee.student.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {fee.student.rollNum}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{fee.feeStructure.name}</TableCell>
                                    <TableCell>{formatCurrency(fee.totalAmount)}</TableCell>
                                    <TableCell>
                                        <Typography color="error">
                                            {formatCurrency(fee.pendingAmount)}
                                        </Typography>
                                        {fee.lateFeeAmount > 0 && (
                                            <Typography variant="caption" color="error" display="block">
                                                + {formatCurrency(fee.lateFeeAmount)} late fee
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(fee.dueDate).toLocaleDateString()}
                                        </Typography>
                                        {fee.daysOverdue > 0 && (
                                            <Typography variant="caption" color="error">
                                                {fee.daysOverdue} days overdue
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={fee.status.replace('_', ' ').toUpperCase()}
                                            color={getStatusColor(fee.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<PaymentIcon />}
                                            onClick={() => markAsPaid(fee.id, fee.pendingAmount)}
                                        >
                                            Mark Paid
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};

// Analytics Tab Component
const AnalyticsTab = ({ analytics, loading, formatCurrency }) => {
    if (loading || !analytics) {
        return <LinearProgress />;
    }

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Payment Methods
                    </Typography>
                    {analytics.paymentMethods.map((method) => (
                        <Box key={method._id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">
                                    {method._id?.toUpperCase() || 'Unknown'}
                                </Typography>
                                <Typography variant="body2">
                                    {formatCurrency(method.totalAmount)}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                                {method.count} payments
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Fee Types
                    </Typography>
                    {analytics.feeTypes.map((feeType) => (
                        <Box key={feeType._id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">
                                    {feeType._id?.toUpperCase() || 'Unknown'}
                                </Typography>
                                <Typography variant="body2">
                                    {formatCurrency(feeType.totalAmount)}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                                {feeType.count} payments
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            </Grid>
        </Grid>
    );
};

// Fee Structure Dialog Component
const FeeStructureDialog = ({ open, onClose, feeStructure, onSave, showSnackbar }) => {
    const { currentUser } = useSelector((state) => state.user);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sclass: '',
        academicYear: '2024-2025',
        feeType: 'tuition',
        paymentFrequency: 'monthly',
        amount: '',
        dueDate: new Date(),
        lateFeeAmount: 0,
        lateFeeType: 'fixed',
        gracePeriodDays: 0,
        isActive: true
    });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchClasses();
            if (feeStructure) {
                setFormData({
                    name: feeStructure.name || '',
                    description: feeStructure.description || '',
                    sclass: feeStructure.sclass?._id || '',
                    academicYear: feeStructure.academicYear || '2024-2025',
                    feeType: feeStructure.feeType || 'tuition',
                    paymentFrequency: feeStructure.paymentFrequency || 'monthly',
                    amount: feeStructure.amount || '',
                    dueDate: new Date(feeStructure.dueDate) || new Date(),
                    lateFeeAmount: feeStructure.lateFeeAmount || 0,
                    lateFeeType: feeStructure.lateFeeType || 'fixed',
                    gracePeriodDays: feeStructure.gracePeriodDays || 0,
                    isActive: feeStructure.isActive !== undefined ? feeStructure.isActive : true
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    sclass: '',
                    academicYear: '2024-2025',
                    feeType: 'tuition',
                    paymentFrequency: 'monthly',
                    amount: '',
                    dueDate: new Date(),
                    lateFeeAmount: 0,
                    lateFeeType: 'fixed',
                    gracePeriodDays: 0,
                    isActive: true
                });
            }
        }
    }, [open, feeStructure]);

    const fetchClasses = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/SclassList/${currentUser._id}`);
            const data = await response.json();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const url = feeStructure 
                ? `${process.env.REACT_APP_BASE_URL}/fee/structure/${feeStructure._id}`
                : `${process.env.REACT_APP_BASE_URL}/fee/structure`;
            
            const method = feeStructure ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    school: currentUser._id,
                    createdBy: currentUser._id
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                onSave();
            } else {
                showSnackbar(data.message || 'Error saving fee structure', 'error');
            }
        } catch (error) {
            console.error('Error saving fee structure:', error);
            showSnackbar('Error saving fee structure', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {feeStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Fee Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={formData.sclass}
                                label="Class"
                                onChange={(e) => setFormData({ ...formData, sclass: e.target.value })}
                            >
                                {classes.map((cls) => (
                                    <MenuItem key={cls._id} value={cls._id}>
                                        {cls.sclassName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Fee Type</InputLabel>
                            <Select
                                value={formData.feeType}
                                label="Fee Type"
                                onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                            >
                                <MenuItem value="tuition">Tuition</MenuItem>
                                <MenuItem value="admission">Admission</MenuItem>
                                <MenuItem value="exam">Exam</MenuItem>
                                <MenuItem value="library">Library</MenuItem>
                                <MenuItem value="transport">Transport</MenuItem>
                                <MenuItem value="hostel">Hostel</MenuItem>
                                <MenuItem value="miscellaneous">Miscellaneous</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Due Date"
                            type="date"
                            value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Late Fee Amount"
                            type="number"
                            value={formData.lateFeeAmount}
                            onChange={(e) => setFormData({ ...formData, lateFeeAmount: parseFloat(e.target.value) })}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                            }
                            label="Active"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FeeManagement;