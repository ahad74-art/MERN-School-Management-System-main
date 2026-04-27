import React, { useEffect, useState } from 'react'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Box, Button, Collapse, Paper, Table, TableBody, TableHead, Typography, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import { calculateOverallAttendancePercentage, calculateSubjectAttendancePercentage, groupAttendanceBySubject } from '../../components/attendanceCalculator';

import CustomBarChart from '../../components/CustomBarChart'

import InsertChartIcon from '@mui/icons-material/InsertChart';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

const ViewStdAttendance = () => {
    const dispatch = useDispatch();

    const [openStates, setOpenStates] = useState({});

    const handleOpen = (subId) => {
        setOpenStates((prevState) => ({
            ...prevState,
            [subId]: !prevState[subId],
        }));
    };

    const { userDetails, currentUser, loading, response, error } = useSelector((state) => state.user);

    useEffect(() => {
        if (currentUser && currentUser._id) {
            console.log('🔍 ViewStdAttendance: Fetching user details for student:', currentUser._id);
            dispatch(getUserDetails(currentUser._id, "Student"));
        }
    }, [dispatch, currentUser]);

    // Debug logging
    useEffect(() => {
        if (response) { 
            console.log('📡 ViewStdAttendance API Response:', response);
        }
        if (error) { 
            console.log('❌ ViewStdAttendance API Error:', error);
        }
        if (userDetails) {
            console.log('👤 ViewStdAttendance User Details:', userDetails);
            console.log('📅 Attendance Data:', userDetails.attendance);
            
            // Debug first attendance record
            if (userDetails.attendance && userDetails.attendance.length > 0) {
                const firstRecord = userDetails.attendance[0];
                console.log('🔍 First attendance record:', firstRecord);
                console.log('- subName type:', typeof firstRecord.subName);
                console.log('- subName value:', firstRecord.subName);
                if (firstRecord.subName && typeof firstRecord.subName === 'object') {
                    console.log('- subName.subName:', firstRecord.subName.subName);
                    console.log('- subName.sessions:', firstRecord.subName.sessions);
                }
            }
        }
    }, [userDetails, response, error]);

    const [subjectAttendance, setSubjectAttendance] = useState([]);
    const [selectedSection, setSelectedSection] = useState('table');
    const [processingError, setProcessingError] = useState(null);

    useEffect(() => {
        if (userDetails) {
            console.log('🔄 Setting subject attendance from userDetails');
            const attendance = userDetails.attendance || [];
            console.log('📊 Raw attendance array:', attendance);
            setSubjectAttendance(attendance);
            setProcessingError(null);
        }
    }, [userDetails]);

    // Safe processing with error handling
    let attendanceBySubject = {};
    let overallAttendancePercentage = 0;
    let subjectData = [];
    let hasValidData = false;

    try {
        if (subjectAttendance && subjectAttendance.length > 0) {
            console.log('🔄 Processing attendance data...');
            attendanceBySubject = groupAttendanceBySubject(subjectAttendance);
            console.log('📊 Grouped attendance:', attendanceBySubject);
            
            overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
            console.log('📈 Overall percentage:', overallAttendancePercentage);
            
            hasValidData = Object.keys(attendanceBySubject).length > 0;
            
            subjectData = Object.entries(attendanceBySubject).map(([subName, { present, sessions }]) => {
                const subjectAttendancePercentage = calculateSubjectAttendancePercentage(present, sessions);
                return {
                    subject: subName,
                    attendancePercentage: subjectAttendancePercentage,
                    totalClasses: sessions,
                    attendedClasses: present
                };
            });
        }
    } catch (err) {
        console.error('❌ Error processing attendance data:', err);
        setProcessingError(err.message);
    }

    const handleSectionChange = (event, newSection) => {
        setSelectedSection(newSection);
    };

    const renderTableSection = () => {
        return (
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B' }}>Attendance</Typography>
                    <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>Your subject-wise attendance records</Typography>
                </Box>

                {processingError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                        Error processing attendance data: {processingError}
                    </Alert>
                )}

                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', mb: 3 }}>
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
                        {Object.entries(attendanceBySubject).map(([subName, { present, allData, subId, sessions }], index) => {
                            const subjectAttendancePercentage = calculateSubjectAttendancePercentage(present, sessions);
                            return (
                                <TableBody key={index}>
                                    <StyledTableRow>
                                        <StyledTableCell>{subName}</StyledTableCell>
                                        <StyledTableCell>{present}</StyledTableCell>
                                        <StyledTableCell>{sessions}</StyledTableCell>
                                        <StyledTableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: subjectAttendancePercentage >= 75 ? '#16A34A' : '#DC2626' }}>
                                                    {subjectAttendancePercentage}%
                                                </Typography>
                                            </Box>
                                        </StyledTableCell>
                                        <StyledTableCell align="center">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleOpen(subId)}
                                                sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#1E3A8A', color: '#1E3A8A', fontSize: 12 }}
                                            >
                                                {openStates[subId] ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                                                Details
                                            </Button>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                    <StyledTableRow>
                                        <StyledTableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                            <Collapse in={openStates[subId]} timeout="auto" unmountOnExit>
                                                <Box sx={{ m: 2 }}>
                                                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E293B', mb: 1.5 }}>
                                                        Attendance Details
                                                    </Typography>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <StyledTableRow>
                                                                <StyledTableCell>Date</StyledTableCell>
                                                                <StyledTableCell align="right">Status</StyledTableCell>
                                                            </StyledTableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {allData.map((data, index) => {
                                                                const date = new Date(data.date);
                                                                const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
                                                                return (
                                                                    <StyledTableRow key={index}>
                                                                        <StyledTableCell>{dateString}</StyledTableCell>
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
                            );
                        })}
                    </Table>
                </Paper>

                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '2px solid #1E3A8A', background: '#EFF6FF' }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1E3A8A' }}>
                        Overall Attendance: {overallAttendancePercentage.toFixed(2)}%
                    </Typography>
                </Paper>
            </Box>
        );
    }

    const renderChartSection = () => {
        return (
            <>
                <CustomBarChart chartData={subjectData} dataKey="attendancePercentage" />
            </>
        )
    };

    return (
        <>
            {loading ? (
                <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                    <Typography sx={{ color: '#64748B' }}>Loading attendance data...</Typography>
                </Box>
            ) : (
                <Box sx={{ background: '#F8FAFC', minHeight: '100vh' }}>
                    {error && (
                        <Alert severity="error" sx={{ m: 3, borderRadius: '8px' }}>
                            {typeof error === 'string' ? error : JSON.stringify(error)}
                        </Alert>
                    )}

                    {hasValidData ? (
                        <>
                            {selectedSection === 'table' && renderTableSection()}
                            {selectedSection === 'chart' && (
                                <Box sx={{ p: 3 }}>
                                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B', mb: 3 }}>Attendance Chart</Typography>
                                    {renderChartSection()}
                                </Box>
                            )}
                            <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid #E2E8F0' }}>
                                <BottomNavigation value={selectedSection} onChange={handleSectionChange} showLabels sx={{ background: '#fff' }}>
                                    <BottomNavigationAction label="Table" value="table" icon={selectedSection === 'table' ? <TableChartIcon /> : <TableChartOutlinedIcon />} />
                                    <BottomNavigationAction label="Chart" value="chart" icon={selectedSection === 'chart' ? <InsertChartIcon /> : <InsertChartOutlinedIcon />} />
                                </BottomNavigation>
                            </Paper>
                        </>
                    ) : (
                        <Box sx={{ p: 3 }}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', textAlign: 'center' }}>
                                <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#1E293B', mb: 1 }}>
                                    {subjectAttendance.length === 0 ? "No Attendance Records Found" : "Unable to Process Attendance Data"}
                                </Typography>
                                <Typography sx={{ fontSize: 14, color: '#64748B' }}>
                                    {subjectAttendance.length === 0
                                        ? "Your attendance will appear here once your teacher marks it."
                                        : "There may be an issue with the attendance data format. Please contact your administrator."}
                                </Typography>
                            </Paper>
                        </Box>
                    )}
                </Box>
            )}
        </>
    )
}

export default ViewStdAttendance