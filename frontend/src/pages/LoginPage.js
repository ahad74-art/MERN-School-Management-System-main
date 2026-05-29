import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, TextField, IconButton, InputAdornment,
    CircularProgress, Backdrop, Checkbox, FormControlLabel,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockIcon from '@mui/icons-material/Lock';
import SchoolIcon from '@mui/icons-material/School';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CastForEducationIcon from '@mui/icons-material/CastForEducation';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import TagIcon from '@mui/icons-material/Tag';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { loginUser } from '../redux/userRelated/userHandle';
import Popup from '../components/Popup';
import backgroundImg from '../assets/designlogin.jpg';

// ─── Role theme config ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
    Admin: {
        gradient: 'linear-gradient(160deg, #0f1f5c 0%, #1E3A8A 50%, #2563EB 100%)',
        btnGradient: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        btnHover: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
        btnShadow: 'rgba(37,99,235,0.4)',
        forgotColor: '#2563EB',
        panelTitle: 'Admin Panel',
        panelSubtitle: 'Secure access to admin dashboard',
        cardTitle: 'Welcome Back, Admin!',
        cardSubtitle: 'Please login to continue',
        secureText: 'Secure login protected by School Management System',
        icon: <AdminPanelSettingsIcon sx={{ fontSize: 32, color: '#1E3A8A' }} />,
        iconBg: '#DBEAFE',
        leftAccent: '#2563EB',
    },
    Teacher: {
        gradient: 'linear-gradient(160deg, #064e3b 0%, #065f46 50%, #059669 100%)',
        btnGradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        btnHover: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
        btnShadow: 'rgba(5,150,105,0.4)',
        forgotColor: '#059669',
        panelTitle: 'Teacher Panel',
        panelSubtitle: 'Access your classes, students and more',
        cardTitle: 'Welcome Back, Teacher!',
        cardSubtitle: 'Please login to continue',
        secureText: 'Secure access to teacher dashboard',
        icon: <CastForEducationIcon sx={{ fontSize: 32, color: '#065f46' }} />,
        iconBg: '#D1FAE5',
        leftAccent: '#059669',
    },
    Student: {
        gradient: 'linear-gradient(160deg, #3b0764 0%, #6d28d9 50%, #7c3aed 100%)',
        btnGradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
        btnHover: 'linear-gradient(135deg, #5b21b6 0%, #6d28d9 100%)',
        btnShadow: 'rgba(109,40,217,0.4)',
        forgotColor: '#7c3aed',
        panelTitle: 'Student Panel',
        panelSubtitle: 'Access your courses, assignments and more',
        cardTitle: 'Welcome Back, Student!',
        cardSubtitle: 'Please login to continue',
        secureText: 'Secure access to student dashboard',
        icon: <SchoolIcon sx={{ fontSize: 32, color: '#6d28d9' }} />,
        iconBg: '#EDE9FE',
        leftAccent: '#7c3aed',
    },
};

// ─── Role feature card on left panel ─────────────────────────────────────────
const RoleCard = ({ icon, label, desc, active, color }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        p: 2, borderRadius: '14px',
        background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
        border: active ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
    }}>
        <Box sx={{
            width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
            background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {icon}
        </Box>
        <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{label}</Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', mt: 0.3 }}>{desc}</Typography>
        </Box>
    </Box>
);

const LoginPage = ({ role }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, currentUser, response, error, currentRole } = useSelector(s => s.user);

    const [toggle, setToggle] = useState(false);
    const [loader, setLoader] = useState(false);
    const [guestLoader, setGuestLoader] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [rollNumberError, setRollNumberError] = useState(false);
    const [studentNameError, setStudentNameError] = useState(false);

    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.Admin;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (role === 'Student') {
            const rollNum = e.target.rollNumber.value;
            const studentName = e.target.studentName.value;
            const password = e.target.password.value;
            if (!rollNum || !studentName || !password) {
                if (!rollNum) setRollNumberError(true);
                if (!studentName) setStudentNameError(true);
                if (!password) setPasswordError(true);
                return;
            }
            setLoader(true);
            dispatch(loginUser({ rollNum, studentName, password }, role));
        } else {
            const email = e.target.email.value;
            const password = e.target.password.value;
            if (!email || !password) {
                if (!email) setEmailError(true);
                if (!password) setPasswordError(true);
                return;
            }
            setLoader(true);
            dispatch(loginUser({ email, password }, role));
        }
    };

    const handleInputChange = (e) => {
        const { name } = e.target;
        if (name === 'email') setEmailError(false);
        if (name === 'password') setPasswordError(false);
        if (name === 'rollNumber') setRollNumberError(false);
        if (name === 'studentName') setStudentNameError(false);
    };

    const handleGuestLogin = async () => {
        const password = 'zxc';
        setGuestLoader(true);
        try {
            await fetch(`${process.env.REACT_APP_BASE_URL}/CreateGuestAccounts`, { method: 'POST' });
        } catch (e) { console.error(e); }
        if (role === 'Admin') dispatch(loginUser({ email: 'guestadmin@gmail.com', password }, role));
        else if (role === 'Student') dispatch(loginUser({ rollNum: '1', studentName: 'Guest Student', password }, role));
        else if (role === 'Teacher') dispatch(loginUser({ email: 'tony@12', password }, role));
    };

    useEffect(() => {
        if (status === 'success' || currentUser !== null) {
            setLoader(false); setGuestLoader(false);
            if (currentRole === 'Admin') navigate('/Admin/dashboard');
            else if (currentRole === 'Student') navigate('/Student/dashboard');
            else if (currentRole === 'Teacher') navigate('/Teacher/dashboard');
        } else if (status === 'failed') {
            setLoader(false); setGuestLoader(false);
            setMessage(response || 'Invalid credentials');
            setShowPopup(true);
        } else if (status === 'error') {
            setLoader(false); setGuestLoader(false);
            setMessage('Network Error');
            setShowPopup(true);
        }
    }, [status, currentRole, navigate, error, response, currentUser]);

    const inputSx = {
        mb: 2,
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            background: '#F8FAFC',
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#CBD5E1' },
            '&.Mui-focused fieldset': { borderColor: cfg.forgotColor },
        },
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>

            {/* ══════════════ LEFT PANEL ══════════════ */}
            <Box sx={{
                display: { xs: 'none', md: 'flex' },
                width: '45%',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 5,
                position: 'relative',
                overflow: 'hidden',
                background: cfg.gradient,
            }}>
                {/* Background image overlay */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${backgroundImg})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.12,
                }} />

                {/* Dot grid top-left */}
                <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', flexWrap: 'wrap', gap: 1.2, width: 80 }}>
                    {[...Array(12)].map((_, i) => (
                        <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.25)' }} />
                    ))}
                </Box>
                {/* Dot grid bottom-right */}
                <Box sx={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', flexWrap: 'wrap', gap: 1.2, width: 80 }}>
                    {[...Array(12)].map((_, i) => (
                        <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)' }} />
                    ))}
                </Box>

                {/* ── Top: Logo + title ── */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Box sx={{
                            width: 52, height: 52, borderRadius: '14px',
                            border: '2px solid rgba(255,255,255,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.15)',
                        }}>
                            <SchoolIcon sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                                School Management
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                                System
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ width: 44, height: 3, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 2, mb: 3 }} />

                    <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.3, mb: 1.5 }}>
                        Manage Your School<br />Efficiently
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, maxWidth: 320 }}>
                        One powerful platform for admins, teachers and students to manage academics, fees, attendance and more.
                    </Typography>
                </Box>

                {/* ── Middle: Role cards ── */}
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', mb: 0.5 }}>
                        PORTAL ACCESS
                    </Typography>
                    <RoleCard
                        active={role === 'Admin'}
                        icon={<AdminPanelSettingsIcon sx={{ color: '#fff', fontSize: 22 }} />}
                        label="Admin"
                        desc="Manage school, users & reports"
                    />
                    <RoleCard
                        active={role === 'Teacher'}
                        icon={<CastForEducationIcon sx={{ color: '#fff', fontSize: 22 }} />}
                        label="Teacher"
                        desc="Classes, lectures & student marks"
                    />
                    <RoleCard
                        active={role === 'Student'}
                        icon={<SchoolIcon sx={{ color: '#fff', fontSize: 22 }} />}
                        label="Student"
                        desc="Subjects, fees & assignments"
                    />
                </Box>

                {/* ── Bottom: Stats row ── */}
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', gap: 3 }}>
                    {[
                        { icon: <GroupsIcon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }} />, label: 'Students' },
                        { icon: <MenuBookIcon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }} />, label: 'Subjects' },
                        { icon: <EmojiEventsIcon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }} />, label: 'Results' },
                    ].map(({ icon, label }) => (
                        <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '10px',
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {icon}
                            </Box>
                            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{label}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* ══════════════ RIGHT PANEL ══════════════ */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 4 },
                background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 50%, #F5F3FF 100%)',
            }}>
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    {/* Mobile header */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3, justifyContent: 'center' }}>
                        <SchoolIcon sx={{ fontSize: 28, color: cfg.forgotColor }} />
                        <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>School Management System</Typography>
                    </Box>

                    {/* Card */}
                    <Box sx={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.13)',
                    }}>
                        {/* Coloured top */}
                        <Box sx={{
                            background: cfg.gradient,
                            position: 'relative',
                            pt: 4, pb: 3, px: 3,
                            textAlign: 'center',
                            overflow: 'hidden',
                        }}>
                            <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
                            <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexWrap: 'wrap', gap: 0.8, width: 56 }}>
                                {[...Array(9)].map((_, i) => <Box key={i} sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.3)' }} />)}
                            </Box>
                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Box sx={{
                                    width: 68, height: 68, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.95)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    mx: 'auto', mb: 1.5,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                }}>
                                    {cfg.icon}
                                </Box>
                                <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#fff', mb: 0.3 }}>{cfg.panelTitle}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{cfg.panelSubtitle}</Typography>
                            </Box>
                        </Box>

                        {/* White form */}
                        <Box sx={{ background: '#fff', px: 3, pt: 3, pb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <PersonIcon sx={{ fontSize: 19, color: cfg.forgotColor }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>{cfg.cardTitle}</Typography>
                                    <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>{cfg.cardSubtitle}</Typography>
                                </Box>
                            </Box>

                            <Box component="form" noValidate onSubmit={handleSubmit}>
                                {role === 'Student' ? (
                                    <>
                                        <TextField fullWidth required name="rollNumber" id="rollNumber"
                                            placeholder="Roll Number" type="number" autoFocus
                                            error={rollNumberError} helperText={rollNumberError && 'Roll Number is required'}
                                            onChange={handleInputChange}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><TagIcon sx={{ fontSize: 17, color: '#94A3B8' }} /></InputAdornment> }}
                                            sx={inputSx} />
                                        <TextField fullWidth required name="studentName" id="studentName"
                                            placeholder="Student Name"
                                            error={studentNameError} helperText={studentNameError && 'Student name is required'}
                                            onChange={handleInputChange}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 17, color: '#94A3B8' }} /></InputAdornment> }}
                                            sx={inputSx} />
                                    </>
                                ) : (
                                    <TextField fullWidth required name="email" id="email"
                                        placeholder="Email address" autoComplete="email" autoFocus
                                        error={emailError} helperText={emailError && 'Email is required'}
                                        onChange={handleInputChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 17, color: '#94A3B8' }} /></InputAdornment> }}
                                        sx={inputSx} />
                                )}

                                <TextField fullWidth required name="password" id="password"
                                    placeholder="Password" type={toggle ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    error={passwordError} helperText={passwordError && 'Password is required'}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 17, color: '#94A3B8' }} /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setToggle(!toggle)} edge="end" size="small">
                                                    {toggle ? <Visibility sx={{ fontSize: 16, color: '#94A3B8' }} /> : <VisibilityOff sx={{ fontSize: 16, color: '#94A3B8' }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={inputSx} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" sx={{ color: cfg.forgotColor, '&.Mui-checked': { color: cfg.forgotColor }, p: 0.5 }} />}
                                        label={<Typography sx={{ fontSize: 12, color: '#64748B' }}>Remember me</Typography>}
                                    />
                                    <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                                        <Typography sx={{ fontSize: 12, color: cfg.forgotColor, fontWeight: 600 }}>Forgot Password?</Typography>
                                    </Link>
                                </Box>

                                {/* Login btn */}
                                <Box component="button" type="submit" disabled={loader || guestLoader}
                                    sx={{
                                        width: '100%', py: 1.4,
                                        background: loader || guestLoader ? '#94A3B8' : cfg.btnGradient,
                                        color: '#fff', border: 'none', borderRadius: '10px',
                                        fontSize: 15, fontWeight: 700, cursor: loader || guestLoader ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                        boxShadow: `0 4px 15px ${cfg.btnShadow}`,
                                        transition: 'all 0.2s', mb: 1.5,
                                        '&:hover:not(:disabled)': { background: cfg.btnHover, transform: 'translateY(-1px)' },
                                    }}>
                                    {loader ? <CircularProgress size={20} color="inherit" /> : <><LockOutlinedIcon sx={{ fontSize: 17 }} /> Login</>}
                                </Box>

                                {/* Guest btn */}
                                <Box component="button" type="button" onClick={handleGuestLogin} disabled={loader || guestLoader}
                                    sx={{
                                        width: '100%', py: 1.2,
                                        background: 'transparent',
                                        border: `1.5px solid ${cfg.forgotColor}30`,
                                        borderRadius: '10px', fontSize: 13, fontWeight: 600,
                                        color: cfg.forgotColor, cursor: 'pointer', transition: 'all 0.2s',
                                        '&:hover:not(:disabled)': { background: `${cfg.forgotColor}08` },
                                    }}>
                                    {guestLoader ? <CircularProgress size={16} sx={{ color: cfg.forgotColor }} /> : 'Login as Guest'}
                                </Box>
                            </Box>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', px: 3, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: 15, color: cfg.forgotColor }} />
                            <Typography sx={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>{cfg.secureText}</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={loader || guestLoader}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Box>
    );
};

export default LoginPage;
