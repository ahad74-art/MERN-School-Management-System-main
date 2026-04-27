import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Collapse, Grid
} from '@mui/material';
import {
    KeyboardArrowDown as ExpandIcon,
    KeyboardArrowUp as CollapseIcon,
    Assignment as TestIcon,
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

const getMyResult = (test, studentId) => {
    if (!test.results || test.results.length === 0) return null;
    return test.results.find(r => r.student?._id === studentId || r.student === studentId) || null;
};

const StudentTests = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    const classID = currentUser?.sclassName?._id;

    useEffect(() => {
        if (!classID) return;
        const fetchTests = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.REACT_APP_BASE_URL}/ClassTests/${classID}`);
                const data = await res.json();
                if (data.success) setTests(data.tests);
            } catch (error) {
                console.error('Error fetching tests:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, [classID]);

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>My Tests</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                    Tests scheduled for your class
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: '#1E293B' }}>
                                {['Test Name', 'Subject', 'Date', 'Duration', 'Total Marks', 'Status', 'My Result', ''].map(h => (
                                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                                        Loading tests...
                                    </TableCell>
                                </TableRow>
                            ) : tests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>
                                        No tests scheduled for your class yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tests.map((test) => {
                                    const myResult = getMyResult(test, currentUser._id);
                                    const isExpanded = expandedRow === test._id;
                                    return (
                                        <React.Fragment key={test._id}>
                                            <TableRow sx={{ '&:hover': { background: '#F8FAFC' }, cursor: 'pointer' }}
                                                onClick={() => setExpandedRow(isExpanded ? null : test._id)}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <TestIcon sx={{ fontSize: 18, color: '#1E3A8A' }} />
                                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                                                            {test.testName}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 13, color: '#475569' }}>
                                                    {test.subject?.subName || 'N/A'}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 13, color: '#475569' }}>
                                                    {new Date(test.testDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 13, color: '#475569' }}>
                                                    {test.duration} min
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 13, color: '#475569' }}>
                                                    {test.totalMarks}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={test.status} size="small"
                                                        sx={{ fontSize: 11, borderRadius: '6px', ...getStatusColor(test.status) }} />
                                                </TableCell>
                                                <TableCell>
                                                    {myResult ? (
                                                        <Box>
                                                            <Typography sx={{
                                                                fontSize: 13, fontWeight: 700,
                                                                color: myResult.marksObtained >= test.passingMarks ? '#16A34A' : '#DC2626'
                                                            }}>
                                                                {myResult.marksObtained} / {test.totalMarks}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 11, color: '#64748B' }}>
                                                                {myResult.marksObtained >= test.passingMarks ? 'Passed' : 'Failed'}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                                                            {test.status === 'completed' ? 'Not evaluated' : '—'}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isExpanded
                                                        ? <CollapseIcon sx={{ fontSize: 18, color: '#64748B' }} />
                                                        : <ExpandIcon sx={{ fontSize: 18, color: '#64748B' }} />}
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded details */}
                                            <TableRow>
                                                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                        <Box sx={{ m: 2, p: 2.5, borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E293B', mb: 2 }}>
                                                                Test Details
                                                            </Typography>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={12}>
                                                                    <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 0.3 }}>Description</Typography>
                                                                    <Typography sx={{ fontSize: 13, color: '#1E293B' }}>
                                                                        {test.description || 'No description provided'}
                                                                    </Typography>
                                                                </Grid>
                                                                {[
                                                                    { label: 'Teacher', value: test.teacher?.name || 'N/A' },
                                                                    { label: 'Passing Marks', value: `${test.passingMarks} / ${test.totalMarks}` },
                                                                    { label: 'Class', value: test.sclass?.sclassName || 'N/A' },
                                                                    ...(test.completedAt ? [{ label: 'Completed On', value: new Date(test.completedAt).toLocaleDateString() }] : []),
                                                                    ...(myResult?.remarks ? [{ label: 'Teacher Remarks', value: myResult.remarks }] : []),
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
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default StudentTests;
