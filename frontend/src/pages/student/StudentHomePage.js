import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { calculateOverallAttendancePercentage } from '../../components/attendanceCalculator';
import CustomPieChart from '../../components/CustomPieChart';
import GuestWelcome from '../../components/GuestWelcome';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import SeeNotice from '../../components/SeeNotice';
import CountUp from 'react-countup';
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const StatCard = ({ icon, label, value, duration }) => (
    <Paper elevation={0} sx={{
        p: 3, borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#fff', display: 'flex', flexDirection: 'column',
        gap: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
        <Box sx={{ color: '#1E3A8A' }}>{icon}</Box>
        <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
            <CountUp start={0} end={value || 0} duration={duration} separator="," />
        </Typography>
    </Paper>
);

const StudentHomePage = () => {
    const dispatch = useDispatch();
    const { userDetails, currentUser, loading, response } = useSelector((state) => state.user);
    const { subjectsList } = useSelector((state) => state.sclass);
    const [subjectAttendance, setSubjectAttendance] = useState([]);
    const [showGuestWelcome, setShowGuestWelcome] = useState(false);
    const classID = currentUser?.sclassName?._id;

    useEffect(() => {
        if (currentUser && currentUser._id && classID) {
            dispatch(getUserDetails(currentUser._id, "Student"));
            dispatch(getSubjectList(classID, "ClassSubjects"));
        }
        if (currentUser && currentUser.email === 'gueststudent@gmail.com') {
            if (!localStorage.getItem('guestWelcomeShown')) {
                setShowGuestWelcome(true);
                localStorage.setItem('guestWelcomeShown', 'true');
            }
        }
    }, [dispatch, currentUser, classID]);

    useEffect(() => {
        if (userDetails) setSubjectAttendance(userDetails.attendance || []);
    }, [userDetails]);

    const overallAttendancePercentage = calculateOverallAttendancePercentage(subjectAttendance);
    const chartData = [
        { name: 'Present', value: overallAttendancePercentage },
        { name: 'Absent', value: 100 - overallAttendancePercentage },
    ];

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B' }}>
                    Welcome, {currentUser?.name}
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                    Here's your academic overview
                </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard icon={<AssignmentIcon />} label="Total Subjects" value={subjectsList?.length} duration={2.5} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard icon={<MenuBookIcon />} label="Total Assignments" value={15} duration={4} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <Paper elevation={0} sx={{
                        p: 2, borderRadius: '12px', border: '1px solid #E2E8F0',
                        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', minHeight: 140,
                    }}>
                        <Typography sx={{ fontSize: 13, color: '#64748B', fontWeight: 500, mb: 1 }}>Attendance</Typography>
                        {response || (!loading && subjectAttendance.length === 0) ? (
                            <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>No data found</Typography>
                        ) : loading ? (
                            <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>Loading...</Typography>
                        ) : (
                            <CustomPieChart data={chartData} />
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Paper elevation={0} sx={{
                borderRadius: '12px', border: '1px solid #E2E8F0',
                background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden',
            }}>
                <Box sx={{ p: 3, pb: 1 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>Notices</Typography>
                </Box>
                <SeeNotice />
            </Paper>

            <GuestWelcome open={showGuestWelcome} onClose={() => setShowGuestWelcome(false)} userRole="Student" />
        </Box>
    );
};

export default StudentHomePage;
