import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Backdrop, Grid } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CastForEducationIcon from '@mui/icons-material/CastForEducation';
import SchoolIcon from '@mui/icons-material/School';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/userRelated/userHandle';
import Popup from '../components/Popup';
import backgroundImg from '../assets/designlogin.jpg';

// ─── Role card config ─────────────────────────────────────────────────────────
const ROLES = [
    {
        key: 'Admin',
        label: 'Admin Panel',
        subtitle: 'School Administrator',
        desc: 'Manage students, teachers, classes, fees, notices and all school operations from one powerful dashboard.',
        icon: <AdminPanelSettingsIcon sx={{ fontSize: 36 }} />,
        gradient: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        hoverGradient: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
        shadow: 'rgba(37,99,235,0.35)',
        features: ['User Management', 'Fee Collection', 'Reports & Analytics'],
    },
    {
        key: 'Teacher',
        label: 'Teacher Portal',
        subtitle: 'Educator & Instructor',
        desc: 'Access your classes, manage student attendance, upload lectures, create tests and communicate with students.',
        icon: <CastForEducationIcon sx={{ fontSize: 36 }} />,
        gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        hoverGradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
        shadow: 'rgba(5,150,105,0.35)',
        features: ['Class Management', 'Lectures & Tests', 'Student Progress'],
    },
    {
        key: 'Student',
        label: 'Student Portal',
        subtitle: 'Learner & Scholar',
        desc: 'View your subjects, track attendance, pay fees, access lectures and stay connected with your teachers.',
        icon: <SchoolIcon sx={{ fontSize: 36 }} />,
        gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
        hoverGradient: 'linear-gradient(135deg, #5b21b6 0%, #6d28d9 100%)',
        shadow: 'rgba(109,40,217,0.35)',
        features: ['Subjects & Marks', 'Fee Payments', 'Lectures & Tests'],
    },
];

// ─── Single role card ─────────────────────────────────────────────────────────
const RoleCard = ({ role, onClick, loading }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Box
            onClick={() => !loading && onClick(role.key)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
                borderRadius: '20px',
                overflow: 'hidden',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: hovered
                    ? `0 20px 50px ${role.shadow}`
                    : '0 8px 30px rgba(0,0,0,0.1)',
                transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Coloured top */}
            <Box sx={{
                background: hovered ? role.hoverGradient : role.gradient,
                p: 3.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.3s',
            }}>
                {/* Dot pattern */}
                <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexWrap: 'wrap', gap: 0.8, width: 48 }}>
                    {[...Array(9)].map((_, i) => (
                        <Box key={i} sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.25)' }} />
                    ))}
                </Box>

                {/* Icon circle */}
                <Box sx={{
                    width: 76, height: 76, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2, color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}>
                    {role.icon}
                </Box>

                <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#fff', mb: 0.3 }}>
                    {role.label}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                    {role.subtitle}
                </Typography>
            </Box>

            {/* White bottom */}
            <Box sx={{
                background: '#fff',
                p: 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}>
                <Typography sx={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, mb: 2 }}>
                    {role.desc}
                </Typography>

                {/* Feature pills */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.5 }}>
                    {role.features.map(f => (
                        <Box key={f} sx={{
                            px: 1.5, py: 0.4, borderRadius: '20px',
                            background: `${role.gradient.includes('2563EB') ? '#EFF6FF' : role.gradient.includes('059669') ? '#D1FAE5' : '#EDE9FE'}`,
                            fontSize: 11, fontWeight: 600,
                            color: role.gradient.includes('2563EB') ? '#1E3A8A' : role.gradient.includes('059669') ? '#065f46' : '#6d28d9',
                        }}>
                            {f}
                        </Box>
                    ))}
                </Box>

                {/* CTA */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                    py: 1.3, borderRadius: '10px',
                    background: hovered ? role.gradient : 'transparent',
                    border: `2px solid`,
                    borderColor: role.gradient.includes('2563EB') ? '#2563EB' : role.gradient.includes('059669') ? '#059669' : '#7c3aed',
                    color: hovered ? '#fff' : (role.gradient.includes('2563EB') ? '#2563EB' : role.gradient.includes('059669') ? '#059669' : '#7c3aed'),
                    fontWeight: 700, fontSize: 14,
                    transition: 'all 0.3s',
                }}>
                    {loading ? <CircularProgress size={18} color="inherit" /> : <>Login as {role.key} <ArrowForwardIcon sx={{ fontSize: 16 }} /></>}
                </Box>
            </Box>
        </Box>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const ChooseUser = ({ visitor }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const password = 'zxc';
    const { status, currentUser, currentRole } = useSelector(state => state.user);
    const [loader, setLoader] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');

    const navigateHandler = async (user) => {
        if (visitor === 'guest') {
            setLoader(true);
            try {
                const seedRes = await fetch(`${process.env.REACT_APP_BASE_URL}/CreateGuestAccounts`, { method: 'POST' });
                const seedData = await seedRes.json();
                if (!seedData.success) {
                    setLoader(false);
                    setMessage('Failed to set up guest accounts. Please try again.');
                    setShowPopup(true);
                    return;
                }
            } catch (e) {
                setLoader(false);
                setMessage('Network error. Please check the server is running.');
                setShowPopup(true);
                return;
            }
            if (user === 'Admin') dispatch(loginUser({ email: 'guestadmin@gmail.com', password }, user));
            else if (user === 'Student') dispatch(loginUser({ rollNum: '1', studentName: 'Guest Student', password }, user));
            else if (user === 'Teacher') dispatch(loginUser({ email: 'tony@12', password }, user));
        } else {
            if (user === 'Admin') navigate('/Adminlogin');
            else if (user === 'Student') navigate('/Studentlogin');
            else if (user === 'Teacher') navigate('/Teacherlogin');
        }
    };

    useEffect(() => {
        if (status === 'success' || currentUser !== null) {
            setLoader(false);
            if (currentRole === 'Admin') navigate('/Admin/dashboard');
            else if (currentRole === 'Student') navigate('/Student/dashboard');
            else if (currentRole === 'Teacher') navigate('/Teacher/dashboard');
        } else if (status === 'error' || status === 'failed') {
            setLoader(false);
            setMessage(status === 'failed' ? 'Invalid credentials. Please try again.' : 'Network Error');
            setShowPopup(true);
        }
    }, [status, currentRole, navigate, currentUser]);

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 50%, #F5F3FF 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background image overlay */}
            <Box sx={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${backgroundImg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: 0.04,
            }} />

            {/* Header */}
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', pt: { xs: 5, md: 7 }, pb: 2, px: 2 }}>
                <Box sx={{
                    width: 64, height: 64, borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 2,
                    boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
                }}>
                    <SchoolIcon sx={{ color: '#fff', fontSize: 32 }} />
                </Box>
                <Typography sx={{ fontSize: { xs: 26, md: 36 }, fontWeight: 900, color: '#1E293B', lineHeight: 1.2, mb: 1 }}>
                    School Management System
                </Typography>
                <Typography sx={{ fontSize: { xs: 14, md: 16 }, color: '#64748B', maxWidth: 480, mx: 'auto' }}>
                    {visitor === 'guest'
                        ? 'Choose a role to explore the system as a guest'
                        : 'Choose your portal to login and access your dashboard'}
                </Typography>

                {/* Stats row */}
                <Box sx={{ display: 'flex', gap: { xs: 2, md: 4 }, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
                    {[
                        { icon: <GroupsIcon sx={{ fontSize: 18, color: '#2563EB' }} />, label: 'Students', color: '#EFF6FF', text: '#1E3A8A' },
                        { icon: <MenuBookIcon sx={{ fontSize: 18, color: '#059669' }} />, label: 'Subjects', color: '#D1FAE5', text: '#065f46' },
                        { icon: <EmojiEventsIcon sx={{ fontSize: 18, color: '#7c3aed' }} />, label: 'Results', color: '#EDE9FE', text: '#6d28d9' },
                    ].map(({ icon, label, color, text }) => (
                        <Box key={label} sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            px: 2, py: 0.8, borderRadius: '20px',
                            background: color, border: `1px solid ${text}20`,
                        }}>
                            {icon}
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: text }}>{label}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Role cards */}
            <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100, px: { xs: 2, md: 4 }, pb: 6, pt: 2 }}>
                <Grid container spacing={3} justifyContent="center">
                    {ROLES.map(role => (
                        <Grid item xs={12} sm={6} md={4} key={role.key}>
                            <RoleCard role={role} onClick={navigateHandler} loading={loader} />
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Footer */}
            <Box sx={{ position: 'relative', zIndex: 1, pb: 4, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <VerifiedUserIcon sx={{ fontSize: 16, color: '#2563EB' }} />
                    <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                        Your data is protected with advanced security measures and encryption
                    </Typography>
                </Box>
            </Box>

            <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={loader}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress color="inherit" />
                    <Typography sx={{ mt: 2, color: '#fff', fontSize: 14 }}>Setting up guest access...</Typography>
                </Box>
            </Backdrop>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Box>
    );
};

export default ChooseUser;
