import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getClassStudents, getSubjectDetails } from '../../redux/sclassRelated/sclassHandle';
import SeeNotice from '../../components/SeeNotice';
import GuestWelcome from '../../components/GuestWelcome';
import CountUp from 'react-countup';
import Students from '../../assets/img1.png';
import Lessons from '../../assets/subjects.svg';
import Tests from '../../assets/assignment.svg';
import Time from '../../assets/time.svg';

const StatCard = ({ img, alt, title, value, duration, suffix, highlight }) => (
    <Paper elevation={0} sx={{
        p: 3, borderRadius: '12px',
        border: highlight ? '2px solid #1E3A8A' : '1px solid #E2E8F0',
        background: '#fff', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', gap: 1, height: '100%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
        <Box sx={{ mb: 1 }}>
            <img src={img} alt={alt} style={{ width: 52, height: 52, objectFit: 'contain' }} />
        </Box>
        <Typography sx={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>{title}</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
            <CountUp start={0} end={value || 0} duration={duration} separator="," suffix={suffix || ''} />
        </Typography>
    </Paper>
);

const TeacherHomePage = ({ selectedClass }) => {
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.user);
    const { subjectDetails, sclassStudents } = useSelector((state) => state.sclass);
    const [showGuestWelcome, setShowGuestWelcome] = useState(false);
    const [testsTaken, setTestsTaken] = useState(0);

    const activeClass = selectedClass || currentUser?.teachSclass?.[0];
    const classID = activeClass?._id;
    const subjectID = currentUser?.teachSubject?._id;
    const teacherID = currentUser?._id;

    const fetchTestStats = React.useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/TestStats/${teacherID}`);
            const data = await response.json();
            if (data.success) setTestsTaken(data.stats.completedTests || 0);
        } catch (error) {
            console.error('Error fetching test stats:', error);
        }
    }, [teacherID]);

    useEffect(() => {
        if (subjectID && classID) {
            dispatch(getSubjectDetails(subjectID, 'Subject'));
            dispatch(getClassStudents(classID));
        }
        if (teacherID) fetchTestStats();
        if (currentUser && currentUser.email === 'tony@12') {
            if (!localStorage.getItem('guestWelcomeShown')) {
                setShowGuestWelcome(true);
                localStorage.setItem('guestWelcomeShown', 'true');
            }
        }
    }, [dispatch, subjectID, classID, currentUser, teacherID, selectedClass, fetchTestStats]);

    const numberOfStudents = sclassStudents?.length || 0;
    const numberOfSessions = subjectDetails?.sessions || 0;

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>
                    Teacher Dashboard
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                    Welcome back, {currentUser?.name}
                </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Students} alt="Students" title="Class Students" value={numberOfStudents} duration={2.5} highlight />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Lessons} alt="Lessons" title="Total Lessons" value={numberOfSessions} duration={5} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Tests} alt="Tests" title="Tests Taken" value={testsTaken} duration={4} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Time} alt="Time" title="Total Hours" value={numberOfSessions} duration={4} suffix=" hrs" />
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

            <GuestWelcome open={showGuestWelcome} onClose={() => setShowGuestWelcome(false)} userRole="Teacher" />
        </Box>
    );
};

export default TeacherHomePage;
