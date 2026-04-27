import { Box, Grid, Paper, Typography } from '@mui/material';
import SeeNotice from '../../components/SeeNotice';
import GuestWelcome from '../../components/GuestWelcome';
import Students from "../../assets/img1.png";
import Classes from "../../assets/img2.png";
import Teachers from "../../assets/img3.png";
import Fees from "../../assets/img4.png";
import CountUp from 'react-countup';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { getAllSclasses } from '../../redux/sclassRelated/sclassHandle';
import { getAllStudents } from '../../redux/studentRelated/studentHandle';
import { getAllTeachers } from '../../redux/teacherRelated/teacherHandle';

const StatCard = ({ img, alt, title, value, prefix, duration, highlight }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            borderRadius: '12px',
            border: highlight ? '2px solid #1E3A8A' : '1px solid #E2E8F0',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
            height: '100%',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}
    >
        <Box sx={{ mb: 1 }}>
            <img src={img} alt={alt} style={{ width: 56, height: 56, objectFit: 'contain' }} />
        </Box>
        <Typography sx={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
            {title}
        </Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
            {prefix && <span style={{ color: '#16A34A' }}>{prefix}</span>}
            <CountUp start={0} end={value} duration={duration} separator="," />
        </Typography>
        {highlight && (
            <Typography sx={{ fontSize: 13, color: '#16A34A', fontWeight: 500 }}>
                +5% this month
            </Typography>
        )}
    </Paper>
);

const AdminHomePage = () => {
    const dispatch = useDispatch();
    const { studentsList } = useSelector((state) => state.student);
    const { sclassesList } = useSelector((state) => state.sclass);
    const { teachersList } = useSelector((state) => state.teacher);
    const { currentUser } = useSelector(state => state.user);
    const [showGuestWelcome, setShowGuestWelcome] = useState(false);
    const [feesCollected, setFeesCollected] = useState(0);

    const adminID = currentUser._id;

    useEffect(() => {
        dispatch(getAllStudents(adminID));
        dispatch(getAllSclasses(adminID, "Sclass"));
        dispatch(getAllTeachers(adminID));

        // Fetch real fees collected from completed payments
        fetch(`${process.env.REACT_APP_BASE_URL}/payment/school/${adminID}/analytics`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setFeesCollected(data.analytics.overall.completedAmount || 0);
                }
            })
            .catch(() => {});

        if (currentUser && currentUser.email === 'guestadmin@gmail.com') {
            const hasSeenWelcome = localStorage.getItem('guestWelcomeShown');
            if (!hasSeenWelcome) {
                setShowGuestWelcome(true);
                localStorage.setItem('guestWelcomeShown', 'true');
            }
        }
    }, [adminID, dispatch, currentUser]);

    const numberOfStudents = studentsList && studentsList.length;
    const numberOfClasses = sclassesList && sclassesList.length;
    const numberOfTeachers = teachersList && teachersList.length;

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>
                    Admin Dashboard
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                    Manage students, teachers and school data efficiently
                </Typography>
            </Box>

            {/* Stat Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Students} alt="Students" title="Total Students" value={numberOfStudents} duration={2.5} highlight />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Classes} alt="Classes" title="Total Classes" value={numberOfClasses} duration={5} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Teachers} alt="Teachers" title="Total Teachers" value={numberOfTeachers} duration={2.5} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard img={Fees} alt="Fees" title="Fees Collection" value={feesCollected} duration={2.5} prefix="Rs " />
                </Grid>
            </Grid>

            {/* Notices Section */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ p: 3, pb: 1 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
                        Notices
                    </Typography>
                </Box>
                <SeeNotice />
            </Paper>

            <GuestWelcome
                open={showGuestWelcome}
                onClose={() => setShowGuestWelcome(false)}
                userRole="Admin"
            />
        </Box>
    );
};

export default AdminHomePage;
