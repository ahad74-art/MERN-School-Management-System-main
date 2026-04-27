import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Collapse,
    Grid, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Select, FormControl,
    InputLabel, IconButton
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    KeyboardArrowDown as ExpandIcon,
    KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

const getStatusColor = (status) => {
    switch (status) {
        case 'completed': return { bgcolor: '#F0FDF4', color: '#16A34A' };
        case 'in-progress': return { bgcolor: '#FFFBEB', color: '#D97706' };
        case 'scheduled': return { bgcolor: '#EFF6FF', color: '#1E3A8A' };
        case 'cancelled': return { bgcolor: '#FEF2F2', color: '#DC2626' };
        default: return { bgcolor: '#F1F5F9', color: '#64748B' };
    }
};

const TeacherTests = ({ selectedClass }) => {
    const { currentUser } = useSelector((state) => state.user);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const activeClass = selectedClass || currentUser?.teachSclass?.[0];

    const [formData, setFormData] = useState({
        testName: '', description: '', totalMarks: '',
        passingMarks: '', testDate: '', duration: '', status: 'scheduled'
    });

    const fetchTests = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/TeacherTests/${currentUser._id}`);
            const data = await res.json();
            if (data.success) setTests(data.tests);
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser._id]);

    useEffect(() => { fetchTests(); }, [selectedClass, fetchTests]);

    const handleCreateTest = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/TestCreate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    teacher: currentUser._id,
                    subject: currentUser.teachSubject._id,
                    sclass: activeClass?._id,
                    school: currentUser.school
                })
            });
            const data = await res.json();
            if (data.success) { setOpenDialog(false); fetchTests(); resetForm(); }
        } catch (error) {
            console.error('Error creating test:', error);
        }
    };

    const handleMarkCompleted = async (testId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/TestComplete/${testId}`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) fetchTests();
        } catch (error) { console.error(error); }
    };

    const handleDeleteTest = async (testId) => {
        if (!window.confirm('Delete this test?')) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/Test/${testId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchTests();
        } catch (error) { console.error(error); }
    };

    const resetForm = () => setFormData({
        testName: '', description: '', totalMarks: '',
        passingMarks: '', testDate: '', duration: '', status: 'scheduled'
    });

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>My Tests</Typography>
                    <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                        Manage tests for {activeClass?.sclassName || 'your class'}
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}
                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                    Create Test
                </Button>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: '#1E293B' }}>
                                {['Test Name', 'Subject', 'Class', 'Date', 'Marks', 'Duration', 'Status', 'Actions', ''].map(h => (
                                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : tests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>
                                        No tests yet. Create your first test!
                                    </TableCell>
                                </TableRow>
                            ) : tests.map((test) => (
                                <React.Fragment key={test._id}>
                                    <TableRow sx={{ '&:hover': { background: '#F8FAFC' }, '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{test.testName}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>{test.subject?.subName}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>{test.sclass?.sclassName}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>{new Date(test.testDate).toLocaleDateString()}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>{test.totalMarks}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>{test.duration} min</TableCell>
                                        <TableCell>
                                            <Chip label={test.status} size="small"
                                                sx={{ fontSize: 11, borderRadius: '6px', ...getStatusColor(test.status) }} />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {test.status !== 'completed' && (
                                                    <IconButton size="small" onClick={() => handleMarkCompleted(test._id)}
                                                        title="Mark Completed" sx={{ color: '#16A34A' }}>
                                                        <CheckCircleIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                <IconButton size="small" onClick={() => handleDeleteTest(test._id)}
                                                    title="Delete" sx={{ color: '#DC2626' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small"
                                                onClick={() => setExpandedRow(expandedRow === test._id ? null : test._id)}>
                                                {expandedRow === test._id
                                                    ? <CollapseIcon sx={{ fontSize: 18, color: '#64748B' }} />
                                                    : <ExpandIcon sx={{ fontSize: 18, color: '#64748B' }} />}
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                                            <Collapse in={expandedRow === test._id} timeout="auto" unmountOnExit>
                                                <Box sx={{ m: 2, p: 2.5, borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E293B', mb: 2 }}>
                                                        Test Details
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12}>
                                                            <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 0.3 }}>Description</Typography>
                                                            <Typography sx={{ fontSize: 13, color: '#1E293B' }}>
                                                                {test.description || 'No description'}
                                                            </Typography>
                                                        </Grid>
                                                        {[
                                                            { label: 'Passing Marks', value: `${test.passingMarks} / ${test.totalMarks}` },
                                                            { label: 'Created', value: new Date(test.createdAt).toLocaleDateString() },
                                                            { label: 'Students Evaluated', value: test.results?.length || 0 },
                                                            ...(test.completedAt ? [{ label: 'Completed', value: new Date(test.completedAt).toLocaleDateString() }] : []),
                                                        ].map(({ label, value }) => (
                                                            <Grid item xs={6} md={3} key={label}>
                                                                <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 0.3 }}>{label}</Typography>
                                                                <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{value}</Typography>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForm(); }}
                maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
                <DialogTitle sx={{ fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
                    Create New Test
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Test Name" value={formData.testName}
                                onChange={(e) => setFormData({ ...formData, testName: e.target.value })} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Description" multiline rows={2} value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Total Marks" type="number" value={formData.totalMarks}
                                onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Passing Marks" type="number" value={formData.passingMarks}
                                onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Test Date" type="date" value={formData.testDate}
                                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                                InputLabelProps={{ shrink: true }} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Duration (minutes)" type="number" value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select value={formData.status} label="Status"
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    sx={{ borderRadius: '8px' }}>
                                    <MenuItem value="scheduled">Scheduled</MenuItem>
                                    <MenuItem value="in-progress">In Progress</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #E2E8F0' }}>
                    <Button onClick={() => { setOpenDialog(false); resetForm(); }}
                        sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
                    <Button onClick={handleCreateTest} variant="contained"
                        sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                        Create Test
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherTests;
