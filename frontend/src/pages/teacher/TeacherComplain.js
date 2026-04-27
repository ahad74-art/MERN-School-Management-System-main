import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { getAllComplains } from '../../redux/complainRelated/complainHandle';

const statusColor = (status) => {
    if (status === 'Resolved') return { bgcolor: '#F0FDF4', color: '#16A34A' };
    if (status === 'In Review') return { bgcolor: '#FFFBEB', color: '#D97706' };
    if (status === 'Closed') return { bgcolor: '#F1F5F9', color: '#64748B' };
    return { bgcolor: '#EFF6FF', color: '#1E3A8A' };
};

const TeacherComplain = () => {
    const dispatch = useDispatch();
    const { complainsList, loading, error } = useSelector((state) => state.complain);
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        if (currentUser?.school?._id) {
            dispatch(getAllComplains(currentUser.school._id, 'Complain'));
        }
    }, [dispatch, currentUser]);

    if (!currentUser || loading) return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Typography sx={{ color: '#64748B' }}>Loading complaints...</Typography>
        </Box>
    );

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>Student Complaints</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>View complaints submitted by students</Typography>
            </Box>

            {complainsList.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', textAlign: 'center' }}>
                    <Typography sx={{ color: '#94A3B8' }}>No complaints found</Typography>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ background: '#1E293B' }}>
                                    {['Student Name', 'Date', 'Category', 'Complaint', 'Status'].map(h => (
                                        <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {complainsList.map((complaint, index) => (
                                    <TableRow key={complaint._id || index} sx={{ '&:hover': { background: '#F8FAFC' }, '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>
                                            {complaint.user?.name || 'Unknown Student'}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>
                                            {new Date(complaint.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={complaint.category || 'Other'} size="small"
                                                sx={{ fontSize: 11, bgcolor: '#F1F5F9', color: '#374151' }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#1E293B', maxWidth: 320 }}>
                                            {complaint.complaint}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={complaint.status || 'Pending'} size="small"
                                                sx={{ fontSize: 11, ...statusColor(complaint.status) }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default TeacherComplain;
