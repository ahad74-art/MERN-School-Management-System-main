import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Paper, Typography, Box, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { getAllComplains } from '../../redux/complainRelated/complainHandle';

const statusColor = (status) => {
    if (status === 'Resolved') return { bgcolor: '#F0FDF4', color: '#16A34A' };
    if (status === 'In Review') return { bgcolor: '#FFFBEB', color: '#D97706' };
    if (status === 'Closed') return { bgcolor: '#F1F5F9', color: '#64748B' };
    return { bgcolor: '#EFF6FF', color: '#1E3A8A' };
};

const priorityColor = (priority) => {
    if (priority === 'Urgent') return { bgcolor: '#FEF2F2', color: '#DC2626' };
    if (priority === 'High') return { bgcolor: '#FFFBEB', color: '#D97706' };
    if (priority === 'Medium') return { bgcolor: '#EFF6FF', color: '#1E3A8A' };
    return { bgcolor: '#F1F5F9', color: '#64748B' };
};

const StudentComplainList = () => {
    const dispatch = useDispatch();
    const { complainsList, loading, error, response } = useSelector((state) => state.complain);
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        if (currentUser?.school?._id) {
            dispatch(getAllComplains(currentUser.school._id, "Complain"));
        }
    }, [dispatch, currentUser]);

    if (!currentUser || loading) return (
        <Box sx={{ p: 3 }}><Typography sx={{ color: '#64748B' }}>Loading complaints...</Typography></Box>
    );

    const studentComplaints = complainsList.filter(c => c.user?._id === currentUser._id);

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 3 }}>My Complaints</Typography>

            {studentComplaints.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <Typography sx={{ color: '#94A3B8' }}>No complaints submitted yet</Typography>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ background: '#1E293B' }}>
                                    {['Date', 'Category', 'Priority', 'Complaint', 'Status', 'Response'].map(h => (
                                        <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {studentComplaints.map((complaint, index) => (
                                    <TableRow key={complaint._id || index} sx={{ '&:hover': { background: '#F1F5F9' }, '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>
                                            {new Date(complaint.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={complaint.category || 'Other'} size="small"
                                                sx={{ fontSize: 11, bgcolor: '#F1F5F9', color: '#374151' }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={complaint.priority || 'Medium'} size="small"
                                                sx={{ fontSize: 11, ...priorityColor(complaint.priority) }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#1E293B', maxWidth: 260 }}>
                                            {complaint.complaint}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={complaint.status || 'Pending'} size="small"
                                                sx={{ fontSize: 11, ...statusColor(complaint.status) }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: '#64748B', maxWidth: 200 }}>
                                            {complaint.response || 'No response yet'}
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

export default StudentComplainList;
