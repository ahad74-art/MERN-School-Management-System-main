import { useState } from 'react';
import {
    CssBaseline, Box, Toolbar, List, Typography,
    Divider, IconButton, Avatar, Tooltip, Menu, MenuItem, ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import { useSelector } from 'react-redux';
import StudentSideBar from './StudentSideBar';
import StudentHomePage from './StudentHomePage';
import StudentProfile from './StudentProfile';
import StudentSubjects from './StudentSubjects';
import ViewStdAttendance from './ViewStdAttendance';
import StudentComplain from './StudentComplain';
import StudentComplainList from './StudentComplainList';
import StudentChat from './StudentChat';
import StudentLectures from './StudentLectures';
import StudentFees from './StudentFees';
import StudentTests from './StudentTests';
import PaymentSuccess from './PaymentSuccess';
import PaymentCancel from './PaymentCancel';
import Logout from '../Logout';

const drawerWidth = 220;
const collapsedWidth = 56;

const AppBar = styled(MuiAppBar, { shouldForwardProp: (p) => p !== 'open' })(
    ({ theme, open }) => ({
        zIndex: theme.zIndex.drawer + 1,
        background: '#fff',
        color: '#1E293B',
        boxShadow: '0 1px 0 #E2E8F0',
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
        }),
        ...(!open && {
            marginLeft: collapsedWidth,
            width: `calc(100% - ${collapsedWidth}px)`,
        }),
    })
);

const Drawer = styled(MuiDrawer, { shouldForwardProp: (p) => p !== 'open' })(
    ({ theme, open }) => ({
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            background: '#fff',
            borderRight: '1px solid #E2E8F0',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: open
                    ? theme.transitions.duration.enteringScreen
                    : theme.transitions.duration.leavingScreen,
            }),
            boxSizing: 'border-box',
        },
    })
);

const StudentDashboard = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const { currentUser } = useSelector(state => state.user);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            <AppBar open={open} position="fixed">
                <Toolbar sx={{ height: 64, pr: 2, gap: 1, minHeight: '64px !important' }}>
                    <IconButton edge="start" onClick={() => setOpen(p => !p)} sx={{ mr: 1 }}>
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title="Account settings">
                        <Box
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                cursor: 'pointer', border: '1px solid #E2E8F0',
                                borderRadius: '8px', px: 1.5, py: 0.5,
                            }}
                        >
                            <Avatar sx={{ width: 30, height: 30, bgcolor: '#1E3A8A', fontSize: 14 }}>
                                {currentUser?.name?.charAt(0) || 'S'}
                            </Avatar>
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1E293B' }}>
                                {currentUser?.name || 'Student'}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>▾</Typography>
                        </Box>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        onClick={() => setAnchorEl(null)}
                        PaperProps={{ elevation: 2, sx: { borderRadius: '10px', mt: 1, minWidth: 160 } }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem component={Link} to="/Student/profile">
                            <ListItemIcon><AccountCircleOutlinedIcon fontSize="small" /></ListItemIcon>
                            Profile
                        </MenuItem>
                        <Divider />
                        <MenuItem component={Link} to="/logout">
                            <ListItemIcon><ExitToAppIcon fontSize="small" /></ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer variant="permanent" open={open}>
                <Box sx={{
                    height: 64, display: 'flex', alignItems: 'center',
                    justifyContent: open ? 'flex-start' : 'center',
                    px: open ? 2 : 1, flexShrink: 0,
                }}>
                    {open && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon sx={{ color: '#1E3A8A', fontSize: 26 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#1E293B' }}>School</Typography>
                        </Box>
                    )}
                </Box>
                <Divider sx={{ borderColor: '#E2E8F0' }} />
                <List component="nav" sx={{ px: open ? 1 : 0.5, pt: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    <StudentSideBar open={open} />
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', background: '#F8FAFC' }}>
                <Toolbar sx={{ minHeight: '64px !important' }} />
                <Routes>
                    <Route path="/" element={<StudentHomePage />} />
                    <Route path='*' element={<Navigate to="/" />} />
                    <Route path="/Student/dashboard" element={<StudentHomePage />} />
                    <Route path="/Student/profile" element={<StudentProfile />} />
                    <Route path="/Student/subjects" element={<StudentSubjects />} />
                    <Route path="/Student/attendance" element={<ViewStdAttendance />} />
                    <Route path="/Student/chat" element={<StudentChat />} />
                    <Route path="/Student/lectures" element={<StudentLectures />} />
                    <Route path="/Student/fees" element={<StudentFees />} />
                    <Route path="/Student/tests" element={<StudentTests />} />
                    <Route path="/Student/fees/success" element={<PaymentSuccess />} />
                    <Route path="/Student/fees/cancel" element={<PaymentCancel />} />
                    <Route path="/Student/complain" element={<StudentComplain />} />
                    <Route path="/Student/complain/list" element={<StudentComplainList />} />
                    <Route path="/logout" element={<Logout />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default StudentDashboard;
