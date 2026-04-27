import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Button, Collapse, Paper, Table, TableBody, TableHead,
    TableRow, TableCell, Typography, Grid, Avatar
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import {
    calculateOverallAttendancePercentage,
    calculateSubjectAttendancePercentage,
    groupAttendanceBySubject
} from '../../components/attendanceCalculator';
import CustomPieChart from '../../components/CustomPieChart';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

const TeacherViewStudent = () => {
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useDispatch();
    const { currentUser, userDetails, loading } = useSelector((state) => state.user);

    const studentID = params.id;
    const teachSubject = currentUser?.teachSubject?.subName;
    const teachSubjectID = currentUser?.teachSubject?._id;

    useEffect(() => {
        dispatch(getUserDetails(studentID, 'Student'));
    }, [dispatch, studentID]);

    const [sclassName, setSclassName] = useState('');
    const [studentSchool, setStudentSchool] = useState('');
    const [subjectMarks, setSubjectMarks] = useState([]);
    const [subjectAttendance, setSubjectAttendance] = useState([]);
    const [openStates, setOpenStates] = useState({});

    const handleOpen = (subId) => {
        setOpenStates((prev) => ({ ...prev, [subId]: !prev[subId] }));
    };

    useEffect(() => {
        if (userDetails) {
            setSclassName(userDetails.sclassName || '');
            setStudentSchool(userDetails.school || '');
            setSubjectMarks(userDetails.examResult || []);
            setSubjectAttendance(userDetails.attendance || []);
        }
    }, [userDetails]);

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
    const chartData = [
        { name: 'Present', value: overallAttendancePercentage },
        { name: 'Absent', value: 100 - overallAttendancePercentage },
    ];

    if (loading) return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Typography sx={{ color: '#64748B' }}>Loading student details...</Typography>
        </Box>
    );

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>Student Details</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>View attendance and marks</Typography>
            </Box>

            {/* Student Info Card */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#1E3A8A', fontSize: 22 }}>
                        {userDetails?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{userDetails?.name}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#64748B' }}>Roll No: {userDetails?.rollNum}</Typography>
                    </Box>
                </Box>
                <Grid container spacing={2}>
                    {[
                        { label: 'Class', value: sclassName?.sclassName || 'N/A' },
                        { label: 'School', value: studentSchool?.schoolName || 'N/A' },
                    ].map(({ label, value }) => (
                        <Grid item xs={12} sm={6} key={label}>
                            <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 0.3 }}>{label}</Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1E293B' }}>{value}</Typography>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Attendance Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E293B', mb: 2 }}>Attendance</Typography>

                {subjectAttendance && subjectAttendance.length > 0 ? (
                    <>
                        {Object.entries(groupAttendanceBySubject(subjectAttendance)).map(([subName, { present, allData, subId, sessions }], index) => {
                            if (subName !== teachSubject) return null;
                            const pct = calculateSubjectAttendancePercentage(present, sessions);
                            return (
                                <Box key={index}>
                                    <Paper elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', mb: 2 }}>
                                        <Table>
                                            <TableHead>
                                                <StyledTableRow>
                                                    <StyledTableCell>Subject</StyledTableCell>
                                                    <StyledTableCell>Present</StyledTableCell>
                                                    <StyledTableCell>Total Sessions</StyledTableCell>
                                                    <StyledTableCell>Attendance %</StyledTableCell>
                                                    <StyledTableCell align="center">Details</StyledTableCell>
                                                </StyledTableRow>
                                            </TableHead>
                                            <TableBody>
                                                <StyledTableRow>
                                                    <StyledTableCell>{subName}</StyledTableCell>
                                                    <StyledTableCell>{present}</StyledTableCell>
                                                    <StyledTableCell>{sessions}</StyledTableCell>
                                                    <StyledTableCell>
                                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: pct >= 75 ? '#16A34A' : '#DC2626' }}>
                                                            {pct}%
                                                        </Typography>
                                                    </StyledTableCell>
                                                    <StyledTableCell align="center">
                                                        <Button variant="outlined" size="small" onClick={() => handleOpen(subId)}
                                                            sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#1E3A8A', color: '#1E3A8A', fontSize: 12 }}>
                                                            {openStates[subId] ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                                                            Details
                                                        </Button>
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                                <StyledTableRow>
                                                    <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                        <Collapse in={openStates[subId]} timeout="auto" unmountOnExit>
                                                            <Box sx={{ m: 2 }}>
                                                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E293B', mb: 1.5 }}>Attendance Details</Typography>
                                                                <Table size="small">
                                                                    <TableHead>
                                                                        <StyledTableRow>
                                                                            <StyledTableCell>Date</StyledTableCell>
                                                                            <StyledTableCell align="right">Status</StyledTableCell>
                                                                        </StyledTableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {allData.map((data, i) => {
                                                                            const date = new Date(data.date);
                                                                            const ds = date.toString() !== 'Invalid Date' ? date.toISOString().substring(0, 10) : 'Invalid Date';
                                                                            return (
                                                                                <StyledTableRow key={i}>
                                                                                    <StyledTableCell>{ds}</StyledTableCell>
                                                                                    <StyledTableCell align="right">
                                                                                        <Box component="span" sx={{
                                                                                            px: 1.5, py: 0.3, borderRadius: '20px', fontSize: 12, fontWeight: 600,
                                                                                            bgcolor: data.status === 'Present' ? '#F0FDF4' : '#FEF2F2',
                                                                                            color: data.status === 'Present' ? '#16A34A' : '#DC2626',
                                                                                        }}>
                                                                                            {data.status}
                                                                                        </Box>
                                                                                    </StyledTableCell>
                                                                                </StyledTableRow>
                                                                            );
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                            </Box>
                                                        </Collapse>
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                            </TableBody>
                                        </Table>
                                    </Paper>
                                </Box>
                            );
                        })}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '2px solid #1E3A8A', background: '#EFF6FF' }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1E3A8A' }}>
                                    Overall Attendance: {overallAttendancePercentage.toFixed(2)}%
                                </Typography>
                            </Paper>
                            <Box sx={{ width: 160 }}>
                                <CustomPieChart data={chartData} />
                            </Box>
                        </Box>
                    </>
                ) : (
                    <Typography sx={{ color: '#94A3B8', fontSize: 14 }}>No attendance records found</Typography>
                )}

                <Button variant="contained" onClick={() => navigate(`/Teacher/class/student/attendance/${studentID}/${teachSubjectID}`)}
                    sx={{ mt: 2, bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                    Add Attendance
                </Button>
            </Paper>

            {/* Marks Section */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E293B', mb: 2 }}>Subject Marks</Typography>

                {subjectMarks && subjectMarks.length > 0 ? (
                    <Paper elevation={0} sx={{ borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', mb: 2 }}>
                        <Table>
                            <TableHead>
                                <StyledTableRow>
                                    <StyledTableCell>Subject</StyledTableCell>
                                    <StyledTableCell>Marks Obtained</StyledTableCell>
                                </StyledTableRow>
                            </TableHead>
                            <TableBody>
                                {subjectMarks.map((result, index) => {
                                    if (!result.subName || result.subName.subName !== teachSubject) return null;
                                    return (
                                        <StyledTableRow key={index}>
                                            <StyledTableCell>{result.subName.subName}</StyledTableCell>
                                            <StyledTableCell>
                                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: result.marksObtained >= 50 ? '#16A34A' : '#DC2626' }}>
                                                    {result.marksObtained}
                                                </Typography>
                                            </StyledTableCell>
                                        </StyledTableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                ) : (
                    <Typography sx={{ color: '#94A3B8', fontSize: 14, mb: 2 }}>No marks recorded yet</Typography>
                )}

                <Button variant="contained" onClick={() => navigate(`/Teacher/class/student/marks/${studentID}/${teachSubjectID}`)}
                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                    Add Marks
                </Button>
            </Paper>
        </Box>
    );
};

export default TeacherViewStudent;
