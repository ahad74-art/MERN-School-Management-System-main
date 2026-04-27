import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Tooltip } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import ChatIcon from '@mui/icons-material/Chat';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AssignmentIcon from '@mui/icons-material/Assignment';

const NavItem = ({ to, icon, label, active, open }) => {
    const btn = (
        <ListItemButton
            component={Link}
            to={to}
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

const TeacherSideBar = ({ open = true }) => {
    const location = useLocation();
    const p = location.pathname;
    const { currentUser } = useSelector((state) => state.user);

    const getClassLabel = () => {
        const classes = currentUser?.teachSclass;
        if (!classes || classes.length === 0) return 'My Class';
        if (classes.length === 1) return `Class ${classes[0].sclassName}`;
        return `My Classes (${classes.length})`;
    };

    return (
        <Box>
            <SectionLabel label="NAVIGATION" open={open} />
            <NavItem open={open} to="/" icon={<HomeIcon />} label="Home" active={p === '/' || p === '/Teacher/dashboard'} />
            <NavItem open={open} to="/Teacher/class" icon={<ClassOutlinedIcon />} label={getClassLabel()} active={p.startsWith('/Teacher/class')} />
            <NavItem open={open} to="/Teacher/chat" icon={<ChatIcon />} label="Messages" active={p.startsWith('/Teacher/chat')} />
            <NavItem open={open} to="/Teacher/lectures" icon={<VideoLibraryIcon />} label="Lectures" active={p.startsWith('/Teacher/lectures')} />
            <NavItem open={open} to="/Teacher/tests" icon={<AssignmentIcon />} label="Tests" active={p.startsWith('/Teacher/tests')} />
            <NavItem open={open} to="/Teacher/complain" icon={<AnnouncementOutlinedIcon />} label="Complain" active={p.startsWith('/Teacher/complain')} />

            <Divider sx={{ my: 1, borderColor: '#E2E8F0' }} />

            <SectionLabel label="ACCOUNT" open={open} />
            <NavItem open={open} to="/Teacher/profile" icon={<AccountCircleOutlinedIcon />} label="Profile" active={p.startsWith('/Teacher/profile')} />
            <NavItem open={open} to="/logout" icon={<ExitToAppIcon />} label="Logout" active={p.startsWith('/logout')} />
        </Box>
    );
};

export default TeacherSideBar;
