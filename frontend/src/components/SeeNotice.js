import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getAllNotices } from '../redux/noticeRelated/noticeHandle';
import {
    Box, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Typography
} from '@mui/material';

const SeeNotice = () => {
    const dispatch = useDispatch();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const { currentUser, currentRole } = useSelector(state => state.user);
    const { noticesList, loading, error, response } = useSelector((state) => state.notice);

    useEffect(() => {
        if (currentUser && currentRole === "Admin" && currentUser._id) {
            dispatch(getAllNotices(currentUser._id, "Notice"));
        } else if (currentUser && currentUser.school && currentUser.school._id) {
            dispatch(getAllNotices(currentUser.school._id, "Notice"));
        }
    }, [dispatch, currentUser, currentRole]);

    if (error) console.log(error);

    const noticeRows = Array.isArray(noticesList) ? noticesList.map((notice) => {
        const date = new Date(notice.date);
        const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
        return { title: notice.title, details: notice.details, date: dateString, id: notice._id };
    }) : [];

    const visibleRows = noticeRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography color="text.secondary">Loading...</Typography></Box>;
    }

    if (response || noticeRows.length === 0) {
        return <Box sx={{ p: 3 }}><Typography color="text.secondary">No Notices to Show Right Now</Typography></Box>;
    }

    return (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ background: '#1E293B' }}>
                            <TableCell sx={{ color: '#fff', fontWeight: 600, fontSize: 14, py: 1.5 }}>Title</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 600, fontSize: 14, py: 1.5 }}>Details</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 600, fontSize: 14, py: 1.5 }}>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visibleRows.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{
                                    '&:hover': { background: '#F1F5F9' },
                                    '&:last-child td': { border: 0 },
                                }}
                            >
                                <TableCell sx={{ fontWeight: 600, fontSize: 14, color: '#1E293B' }}>{row.title}</TableCell>
                                <TableCell sx={{ fontSize: 14, color: '#475569' }}>{row.details}</TableCell>
                                <TableCell sx={{ fontSize: 14, color: '#475569' }}>{row.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={noticeRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                sx={{ borderTop: '1px solid #E2E8F0' }}
            />
        </Box>
    );
}

export default SeeNotice