import * as React from 'react';
import {
    Divider, ListItemButton, ListItemIcon, ListItemText,
    Typography, Box, Tooltip, Collapse, List
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PaymentIcon from '@mui/icons-material/Payment';
import QuizIcon from '@mui/icons-material/Quiz';

const NavItem = ({ to, icon, label, active, open, onClick, children, expandIcon }) => {
    const btn = (
        <ListItemButton
            component={to ? Link : 'div'}
            to={to}
            onClick={onClick}
            sx={{
                borderRadius: '8px', mb: 0.5, py: 1,
                px: open ? 1.5 : 1,
                justifyContent: open ? 'flex-start' : 'center',
                minHeight: 40,
                background: active ? '#EFF6FF' : 'transparent',
                '&:hover': { background: active ? '#EFF6FF' : '#F1F5F9' },
            }}
        >
            <ListItemIcon sx={{ minWidth: open ? 36 : 'unset', justifyContent: 'center' }}>
                {React.cloneElement(icon, { sx: { fontSize: 20, color: active ? '#1E3A8A' : '#64748B' } })}
            </ListItemIcon>
            {open && (
                <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#1E3A8A' : '#374151', noWrap: true }}
                />
            )}
            {open && expandIcon}
        </ListItemButton>
    );
    return open ? btn : <Tooltip title={label} placement="right" arrow>{btn}</Tooltip>;
};

const SectionLabel = ({ label, open }) =>
    open ? (
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', px: 1.5, pt: 1.5, pb: 0.5 }}>
            {label}
        </Typography>
    ) : <Box sx={{ height: 8 }} />;

const StudentSideBar = ({ open = true }) => {
    const location = useLocation();
    const p = location.pathname;
    const [complainOpen, setComplainOpen] = React.useState(false);

    return (
        <Box>
            <SectionLabel label="NAVIGATION" open={open} />
            <NavItem open={open} to="/" icon={<HomeIcon />} label="Home" active={p === '/' || p === '/Student/dashboard'} />
            <NavItem open={open} to="/Student/subjects" icon={<AssignmentIcon />} label="Subjects" active={p.startsWith('/Student/subjects')} />
            <NavItem open={open} to="/Student/attendance" icon={<ClassOutlinedIcon />} label="Attendance" active={p.startsWith('/Student/attendance')} />
            <NavItem open={open} to="/Student/chat" icon={<ChatIcon />} label="Messages" active={p.startsWith('/Student/chat')} />
            <NavItem open={open} to="/Student/lectures" icon={<VideoLibraryIcon />} label="Lectures" active={p.startsWith('/Student/lectures')} />
            <NavItem open={open} to="/Student/fees" icon={<PaymentIcon />} label="My Fees" active={p.startsWith('/Student/fees')} />
            <NavItem open={open} to="/Student/tests" icon={<QuizIcon />} label="My Tests" active={p.startsWith('/Student/tests')} />
            <NavItem
                open={open}
                icon={<AnnouncementOutlinedIcon />}
                label="Complain"
                active={p.startsWith('/Student/complain')}
                onClick={() => setComplainOpen(v => !v)}
                expandIcon={complainOpen ? <ExpandLess sx={{ fontSize: 18, color: '#94A3B8' }} /> : <ExpandMore sx={{ fontSize: 18, color: '#94A3B8' }} />}
            />
            {open && (
                <Collapse in={complainOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <NavItem open={open} to="/Student/complain" icon={<AddIcon />} label="Add Complain" active={p === '/Student/complain'} />
                        <NavItem open={open} to="/Student/complain/list" icon={<ListIcon />} label="View Complains" active={p === '/Student/complain/list'} />
                    </List>
                </Collapse>
            )}

            <Divider sx={{ my: 1, borderColor: '#E2E8F0' }} />

            <SectionLabel label="ACCOUNT" open={open} />
            <NavItem open={open} to="/Student/profile" icon={<AccountCircleOutlinedIcon />} label="Profile" active={p.startsWith('/Student/profile')} />
            <NavItem open={open} to="/logout" icon={<ExitToAppIcon />} label="Logout" active={p.startsWith('/logout')} />
        </Box>
    );
};

export default StudentSideBar;
