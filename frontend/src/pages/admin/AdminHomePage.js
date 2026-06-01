import { Box, Grid, Paper, Typography, Chip, Avatar } from '@mui/material';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';

const StatCard = ({ img, alt, title, value, prefix, duration, highlight }) => (
    <Paper elevation={0} sx={{
        p: 3, borderRadius: '12px',
        border: highlight ? '2px solid #1E3A8A' : '1px solid #E2E8F0',
        background: '#fff', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', gap: 1, height: '100%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
        <Box sx={{ mb: 1 }}>
            <img src={img} alt={alt} style={{ width: 56, height: 56, objectFit: 'contain' }} />
        </Box>
        <Typography sx={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>{title}</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
            {prefix && <span style={{ color: '#16A34A' }}>{prefix}</span>}
            <CountUp start={0} end={value || 0} duration={duration} separator="," />
        </Typography>
        {highlight && (
            <Typography sx={{ fontSize: 13, color: '#16A34A', fontWeight: 500 }}>Live total</Typography>
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
    const [recentPayments, setRecentPayments] = useState([]);

    const adminID = currentUser._id;

    const fetchFeeSummary = () => {
        // Use the simple Mongoose-based endpoint (no ObjectId cast issues)
        fetch(`${process.env.REACT_APP_BASE_URL}/fee/summary/${adminID}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setFeesCollected(data.totalCollected || 0);
                    setRecentPayments(data.recentPayments || []);
                }
            })
            .catch(err => console.error('Fee summary error:', err));
    };

    useEffect(() => {
        dispatch(getAllStudents(adminID));
        dispatch(getAllSclasses(adminID, "Sclass"));
        dispatch(getAllTeachers(adminID));

        fetchFeeSummary();
        // Auto-refresh every 20 seconds
        const interval = setInterval(fetchFeeSummary, 20000);

        if (currentUser && currentUser.email === 'guestadmin@gmail.com') {
            const hasSeenWelcome = localStorage.getItem('guestWelcomeShown');
            if (!hasSeenWelcome) {
                setShowGuestWelcome(true);
                localStorage.setItem('guestWelcomeShown', 'true');
            }
        }

        return () => clearInterval(interval);
    }, [adminID, dispatch, currentUser]);

    const numberOfStudents = studentsList && studentsList.length;
    const numberOfClasses = sclassesList && sclassesList.length;
    const numberOfTeachers = teachersList && teachersList.length;

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount || 0);

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>Admin Dashboard</Typography>
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
                    <StatCard img={Fees} alt="Fees" title="Fees Collected" value={feesCollected} duration={2.5} prefix="Rs " />
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Recent Payments */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                        <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PaymentIcon sx={{ color: '#1E3A8A', fontSize: 20 }} />
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                                Recent Fee Payments
                            </Typography>
                            <Chip label={`${recentPayments.length} paid`} size="small"
                                sx={{ ml: 'auto', bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 600, fontSize: 11 }} />
                        </Box>

                        {recentPayments.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>No payments received yet</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                                {recentPayments.map((p, i) => (
                                    <Box key={p.paymentId || i} sx={{
                                        display: 'flex', alignItems: 'center', gap: 2,
                                        px: 2.5, py: 1.5,
                                        borderBottom: i < recentPayments.length - 1 ? '1px solid #F1F5F9' : 'none',
                                        '&:hover': { background: '#F8FAFC' },
                                    }}>
                                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#EFF6FF', color: '#1E3A8A', fontSize: 14, fontWeight: 700 }}>
                                            {p.student?.name?.charAt(0) || 'S'}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B', noWrap: true }}>
                                                {p.student?.name || 'Unknown'}
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>
                                                Roll: {p.student?.rollNum || 'N/A'} • {p.feeType}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
                                                {formatCurrency(p.amount)}
                                            </Typography>
                                            <Typography sx={{ fontSize: 10, color: '#94A3B8' }}>
                                                {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : ''}
                                            </Typography>
                                        </Box>
                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A', flexShrink: 0 }} />
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Notices */}
                <Grid item xs={12} lg={6}>
                    <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', height: '100%' }}>
                        <Box sx={{ p: 2.5, pb: 1 }}>
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Notices</Typography>
                        </Box>
                        <SeeNotice />
                    </Paper>
                </Grid>
            </Grid>

            <GuestWelcome open={showGuestWelcome} onClose={() => setShowGuestWelcome(false)} userRole="Admin" />
        </Box>
    );
};

export default AdminHomePage;
