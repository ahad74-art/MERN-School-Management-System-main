import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, CircularProgress, LinearProgress, Snackbar, Alert,
    Chip, IconButton, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const today = new Date().toISOString().split('T')[0];

const TeacherBulkAttendance = () => {
    const { classId, subjectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);

    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(today);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/Sclass/Students/${classId}`
            );
            if (!response.ok) throw new Error(`Failed to fetch students (${response.status})`);
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];
            setStudents(list);
            // Default all students to 'Present'
            const initialAttendance = {};
            list.forEach((s) => { initialAttendance[s._id] = 'Present'; });
            setAttendance(initialAttendance);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err.message || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleStatusToggle = (studentId, status) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        if (students.length === 0) {
            setSnackbar({ open: true, message: 'No students to submit attendance for.', severity: 'info' });
            return;
        }

        // Validate statuses before submitting
        const invalidStudents = students.filter(
            (s) => !['Present', 'Absent'].includes(attendance[s._id])
        );
        if (invalidStudents.length > 0) {
            setSnackbar({
                open: true,
                message: `Invalid status for: ${invalidStudents.map((s) => s.name).join(', ')}`,
                severity: 'error',
            });
            return;
        }

        const records = students.map((s) => ({
            studentId: s._id,
            subName: subjectId,
            status: attendance[s._id] || 'Present',
            date: date,
        }));

        setSubmitting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/BulkStudentAttendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendanceRecords: records }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setSnackbar({
                    open: true,
                    message: `Attendance submitted successfully (${data.saved} saved)`,
                    severity: 'success',
                });
            } else {
                setSnackbar({
                    open: true,
                    message: data.message || 'Failed to submit attendance',
                    severity: 'error',
                });
            }
        } catch (err) {
            console.error('Submit error:', err);
            setSnackbar({
                open: true,
                message: err.message || 'Error submitting attendance',
                severity: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const presentCount = students.filter((s) => attendance[s._id] === 'Present').length;
    const absentCount = students.filter((s) => attendance[s._id] === 'Absent').length;

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Tooltip title="Go back">
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{
                            color: '#1E3A8A',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            bgcolor: '#fff',
                            '&:hover': { bgcolor: '#EFF6FF' },
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
                <Box>
                    <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>
                        Take Class Attendance
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.25 }}>
                        Mark attendance for all students in this class
                    </Typography>
                </Box>
            </Box>

            {/* Loading state */}
            {loading && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress sx={{ borderRadius: 4 }} />
                    <Typography sx={{ mt: 1.5, color: '#64748B', fontSize: 14 }}>
                        Loading students...
                    </Typography>
                </Box>
            )}

            {/* Error state */}
            {!loading && error && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        background: '#fff',
                        textAlign: 'center',
                        mb: 3,
                    }}
                >
                    <Typography sx={{ color: '#DC2626', fontSize: 15, mb: 2 }}>{error}</Typography>
                    <Button
                        variant="contained"
                        onClick={fetchStudents}
                        sx={{
                            bgcolor: '#1E3A8A',
                            borderRadius: '8px',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#1E293B' },
                        }}
                    >
                        Retry
                    </Button>
                </Paper>
            )}

            {/* Main content — only shown when not loading and no error */}
            {!loading && !error && (
                <>
                    {/* Date picker + summary card */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            background: '#fff',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                flexWrap: 'wrap',
                            }}
                        >
                            <TextField
                                label="Date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                inputProps={{ max: today }}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                sx={{
                                    minWidth: 180,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        '&:hover fieldset': { borderColor: '#1E3A8A' },
                                        '&.Mui-focused fieldset': { borderColor: '#1E3A8A' },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#1E3A8A' },
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Chip
                                    label={`Present: ${presentCount}`}
                                    size="small"
                                    sx={{
                                        bgcolor: '#DCFCE7',
                                        color: '#16A34A',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        borderRadius: '6px',
                                    }}
                                />
                                <Chip
                                    label={`Absent: ${absentCount}`}
                                    size="small"
                                    sx={{
                                        bgcolor: '#FEE2E2',
                                        color: '#DC2626',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        borderRadius: '6px',
                                    }}
                                />
                                <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>
                                    Total: {students.length}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Empty state */}
                    {students.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                borderRadius: '12px',
                                border: '1px solid #E2E8F0',
                                background: '#fff',
                                textAlign: 'center',
                            }}
                        >
                            <Typography sx={{ color: '#94A3B8', fontSize: 15 }}>
                                No students found in this class
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            {/* Students table */}
                            <Paper
                                elevation={0}
                                sx={{
                                    mb: 3,
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    overflow: 'hidden',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                                }}
                            >
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ background: '#1E293B' }}>
                                                {['#', 'Student Name', 'Roll Number', 'Status'].map((h) => (
                                                    <TableCell
                                                        key={h}
                                                        sx={{ color: '#fff', fontWeight: 600, fontSize: 13 }}
                                                    >
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {students.map((student, index) => {
                                                const status = attendance[student._id] || 'Present';
                                                const isPresent = status === 'Present';
                                                const isAbsent = status === 'Absent';

                                                return (
                                                    <TableRow
                                                        key={student._id}
                                                        sx={{
                                                            '&:hover': { background: '#F8FAFC' },
                                                            '&:last-child td': { border: 0 },
                                                        }}
                                                    >
                                                        <TableCell sx={{ fontSize: 13, color: '#64748B', width: 48 }}>
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                                                                {student.name}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: 13, color: '#475569' }}>
                                                            {student.rollNum}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                <Button
                                                                    size="small"
                                                                    variant={isPresent ? 'contained' : 'outlined'}
                                                                    onClick={() => handleStatusToggle(student._id, 'Present')}
                                                                    sx={{
                                                                        borderRadius: '8px',
                                                                        textTransform: 'none',
                                                                        fontSize: 12,
                                                                        minWidth: 80,
                                                                        ...(isPresent
                                                                            ? {
                                                                                  bgcolor: '#16A34A',
                                                                                  '&:hover': { bgcolor: '#15803D' },
                                                                              }
                                                                            : {
                                                                                  borderColor: '#16A34A',
                                                                                  color: '#16A34A',
                                                                                  '&:hover': {
                                                                                      borderColor: '#15803D',
                                                                                      bgcolor: '#F0FDF4',
                                                                                  },
                                                                              }),
                                                                    }}
                                                                >
                                                                    Present
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant={isAbsent ? 'contained' : 'outlined'}
                                                                    onClick={() => handleStatusToggle(student._id, 'Absent')}
                                                                    sx={{
                                                                        borderRadius: '8px',
                                                                        textTransform: 'none',
                                                                        fontSize: 12,
                                                                        minWidth: 80,
                                                                        ...(isAbsent
                                                                            ? {
                                                                                  bgcolor: '#DC2626',
                                                                                  '&:hover': { bgcolor: '#B91C1C' },
                                                                              }
                                                                            : {
                                                                                  borderColor: '#DC2626',
                                                                                  color: '#DC2626',
                                                                                  '&:hover': {
                                                                                      borderColor: '#B91C1C',
                                                                                      bgcolor: '#FEF2F2',
                                                                                  },
                                                                              }),
                                                                    }}
                                                                >
                                                                    Absent
                                                                </Button>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>

                            {/* Submit button */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    disabled={submitting}
                                    onClick={handleSubmit}
                                    startIcon={
                                        submitting ? (
                                            <CircularProgress size={18} sx={{ color: '#fff' }} />
                                        ) : null
                                    }
                                    sx={{
                                        bgcolor: '#1E3A8A',
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        px: 4,
                                        py: 1.25,
                                        '&:hover': { bgcolor: '#1E293B' },
                                        '&.Mui-disabled': { bgcolor: '#94A3B8', color: '#fff' },
                                    }}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Attendance'}
                                </Button>
                            </Box>
                        </>
                    )}
                </>
            )}

            {/* Snackbar feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    sx={{ borderRadius: '10px' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TeacherBulkAttendance;
