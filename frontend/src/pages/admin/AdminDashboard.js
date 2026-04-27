import { useState, useRef, useEffect } from 'react';
import {
    CssBaseline, Box, Toolbar, List, Typography,
    Divider, IconButton, InputBase, Avatar,
    Tooltip, Menu, MenuItem, ListItemIcon, Paper, Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';
import { useSelector, useDispatch } from 'react-redux';
import { getAllStudents } from '../../redux/studentRelated/studentHandle';
import { getAllTeachers } from '../../redux/teacherRelated/teacherHandle';

import SideBar from './SideBar';
import AdminProfile from './AdminProfile';
import AdminHomePage from './AdminHomePage';
import AddStudent from './studentRelated/AddStudent';
import SeeComplains from './studentRelated/SeeComplains';
import ShowStudents from './studentRelated/ShowStudents';
import StudentAttendance from './studentRelated/StudentAttendance';
import StudentExamMarks from './studentRelated/StudentExamMarks';
import StudentDetailsView from './studentRelated/StudentDetailsView';
import TeacherDetailsView from './teacherRelated/TeacherDetailsView';
import AddNotice from './noticeRelated/AddNotice';
import ShowNotices from './noticeRelated/ShowNotices';
import ShowSubjects from './subjectRelated/ShowSubjects';
import SubjectForm from './subjectRelated/SubjectForm';
import ViewSubject from './subjectRelated/ViewSubject';
import AddTeacher from './teacherRelated/AddTeacher';
import ChooseClass from './teacherRelated/ChooseClass';
import ChooseSubject from './teacherRelated/ChooseSubject';
import ShowTeachers from './teacherRelated/ShowTeachers';
import AddClass from './classRelated/AddClass';
import ClassDetails from './classRelated/ClassDetails';
import ShowClasses from './classRelated/ShowClasses';
import FeeManagement from './feeRelated/FeeManagement';
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
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        }),
        ...(!open && {
            marginLeft: `${collapsedWidth}px`,
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

// Search dropdown component
const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const wrapperRef = useRef(null);

    const { currentUser } = useSelector(state => state.user);
    const { studentsList } = useSelector(state => state.student);
    const { teachersList } = useSelector(state => state.teacher);

    // Load data once
    useEffect(() => {
        if (currentUser?._id) {
            dispatch(getAllStudents(currentUser._id));
            dispatch(getAllTeachers(currentUser._id));
        }
    }, [currentUser, dispatch]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSearch = (value) => {
        setQuery(value);
        if (!value.trim()) { setResults([]); setShowDropdown(false); return; }

        const q = value.toLowerCase();
        const students = (studentsList || [])
            .filter(s => s.name?.toLowerCase().includes(q))
            .map(s => ({ id: s._id, name: s.name, type: 'Student', path: `/Admin/students/student/${s._id}` }));

        const teachers = (teachersList || [])
            .filter(t => t.name?.toLowerCase().includes(q))
            .map(t => ({ id: t._id, name: t.name, type: 'Teacher', path: `/Admin/teachers/teacher/${t._id}` }));

        setResults([...students, ...teachers].slice(0, 8));
        setShowDropdown(true);
    };

    const handleSelect = (item) => {
        setQuery('');
        setResults([]);
        setShowDropdown(false);
        navigate(item.path);
    };

    return (
        <Box ref={wrapperRef} sx={{ position: 'relative' }}>
            <Box sx={{
                display: 'flex', alignItems: 'center',
                background: '#F1F5F9', borderRadius: '8px',
                px: 1.5, py: 0.5, width: 280,
            }}>
                <SearchIcon sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} />
                <InputBase
                    placeholder="Search students or teachers..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    sx={{ fontSize: 14, color: '#475569', flex: 1 }}
                />
            </Box>

            {showDropdown && results.length > 0 && (
                <Paper
                    elevation={4}
                    sx={{
                        position: 'absolute', top: '110%', left: 0,
                        width: 320, zIndex: 9999,
                        borderRadius: '10px', overflow: 'hidden',
                        border: '1px solid #E2E8F0',
                    }}
                >
                    {results.map((item) => (
                        <Box
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                px: 2, py: 1.2, cursor: 'pointer',
                                '&:hover': { background: '#F1F5F9' },
                                borderBottom: '1px solid #F1F5F9',
                            }}
                        >
                            <Avatar sx={{ width: 28, height: 28, bgcolor: item.type === 'Student' ? '#1E3A8A' : '#0F766E', fontSize: 12 }}>
                                {item.name.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{item.name}</Typography>
                            </Box>
                            <Chip
                                label={item.type}
                                size="small"
                                sx={{
                                    fontSize: 11, height: 20,
                                    bgcolor: item.type === 'Student' ? '#EFF6FF' : '#F0FDFA',
                                    color: item.type === 'Student' ? '#1E3A8A' : '#0F766E',
                                }}
                            />
                        </Box>
                    ))}
                </Paper>
            )}

            {showDropdown && query.trim() && results.length === 0 && (
                <Paper elevation={4} sx={{ position: 'absolute', top: '110%', left: 0, width: 280, zIndex: 9999, borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>No results found</Typography>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

const AdminDashboard = () => {
    const [open, setOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const { currentUser } = useSelector(state => state.user);

    const toggleDrawer = () => setOpen(prev => !prev);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* Top Navbar */}
            <AppBar open={open} position="fixed">
                <Toolbar sx={{ height: 64, pr: 2, gap: 1, minHeight: '64px !important' }}>
                    {/* Hamburger — always visible */}
                    <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 1 }}>
                        <MenuIcon />
                    </IconButton>

                    <SearchBar />

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Admin avatar + name */}
                    <Tooltip title="Account settings">
                        <Box
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                cursor: 'pointer', ml: 1,
                                border: '1px solid #E2E8F0', borderRadius: '8px',
                                px: 1.5, py: 0.5,
                            }}
                        >
                            <Avatar sx={{ width: 30, height: 30, bgcolor: '#1E3A8A', fontSize: 14 }}>
                                {currentUser?.name?.charAt(0) || 'A'}
                            </Avatar>
                            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1E293B' }}>
                                {currentUser?.name || 'Admin'}
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
                        <MenuItem component={Link} to="/Admin/profile">
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

            {/* Sidebar */}
            <Drawer variant="permanent" open={open}>
                {/* Logo area */}
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
                    <SideBar open={open} />
                </List>
            </Drawer>

            {/* Main content */}
            <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto', background: '#F8FAFC' }}>
                <Toolbar sx={{ minHeight: '64px !important' }} />
                <Routes>
                    <Route path="/" element={<AdminHomePage />} />
                    <Route path='*' element={<Navigate to="/" />} />
                    <Route path="/Admin/dashboard" element={<AdminHomePage />} />
                    <Route path="/Admin/profile" element={<AdminProfile />} />
                    <Route path="/Admin/complains" element={<SeeComplains />} />
                    <Route path="/Admin/addnotice" element={<AddNotice />} />
                    <Route path="/Admin/notices" element={<ShowNotices />} />
                    <Route path="/Admin/subjects" element={<ShowSubjects />} />
                    <Route path="/Admin/subjects/subject/:classID/:subjectID" element={<ViewSubject />} />
                    <Route path="/Admin/subjects/chooseclass" element={<ChooseClass situation="Subject" />} />
                    <Route path="/Admin/addsubject/:id" element={<SubjectForm />} />
                    <Route path="/Admin/class/subject/:classID/:subjectID" element={<ViewSubject />} />
                    <Route path="/Admin/subject/student/attendance/:studentID/:subjectID" element={<StudentAttendance situation="Subject" />} />
                    <Route path="/Admin/subject/student/marks/:studentID/:subjectID" element={<StudentExamMarks situation="Subject" />} />
                    <Route path="/Admin/addclass" element={<AddClass />} />
                    <Route path="/Admin/classes" element={<ShowClasses />} />
                    <Route path="/Admin/classes/class/:id" element={<ClassDetails />} />
                    <Route path="/Admin/class/addstudents/:id" element={<AddStudent situation="Class" />} />
                    <Route path="/Admin/addstudents" element={<AddStudent situation="Student" />} />
                    <Route path="/Admin/students" element={<ShowStudents />} />
                    <Route path="/Admin/students/student/:id" element={<StudentDetailsView />} />
                    <Route path="/Admin/students/student/attendance/:id" element={<StudentAttendance situation="Student" />} />
                    <Route path="/Admin/students/student/marks/:id" element={<StudentExamMarks situation="Student" />} />
                    <Route path="/Admin/teachers" element={<ShowTeachers />} />
                    <Route path="/Admin/teachers/teacher/:id" element={<TeacherDetailsView />} />
                    <Route path="/Admin/teachers/chooseclass" element={<ChooseClass situation="Teacher" />} />
                    <Route path="/Admin/teachers/choosesubject/:id" element={<ChooseSubject situation="Norm" />} />
                    <Route path="/Admin/teachers/choosesubject/:classID/:teacherID" element={<ChooseSubject situation="Teacher" />} />
                    <Route path="/Admin/teachers/addteacher/:id" element={<AddTeacher />} />
                    <Route path="/Admin/fees" element={<FeeManagement />} />
                    <Route path="/logout" element={<Logout />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default AdminDashboard;
