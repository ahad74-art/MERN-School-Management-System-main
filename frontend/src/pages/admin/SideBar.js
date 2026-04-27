import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Tooltip } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

import HomeIcon from '@mui/icons-material/Home';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';

const NavItem = ({ to, icon, label, active, open }) => {
    const btn = (
        <ListItemButton
            component={Link}
            to={to}
            sx={{
                borderRadius: '8px',
                mb: 0.5,
                py: 1,
                px: open ? 1.5 : 1,
                justifyContent: open ? 'flex-start' : 'center',
                minHeight: 40,
                background: active ? '#EFF6FF' : 'transparent',
                '&:hover': { background: active ? '#EFF6FF' : '#F1F5F9' },
            }}
        >
            <ListItemIcon sx={{ minWidth: open ? 36 : 'unset', justifyContent: 'center' }}>
                {React.cloneElement(icon, {
                    sx: { fontSize: 20, color: active ? '#1E3A8A' : '#64748B' },
                })}
            </ListItemIcon>
            {open && (
                <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: active ? 600 : 400,
                        color: active ? '#1E3A8A' : '#374151',
                        noWrap: true,
                    }}
                />
            )}
        </ListItemButton>
    );

    return open ? btn : (
        <Tooltip title={label} placement="right" arrow>
            {btn}
        </Tooltip>
    );
};

const SectionLabel = ({ label, open }) =>
    open ? (
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', px: 1.5, pt: 1.5, pb: 0.5 }}>
            {label}
        </Typography>
    ) : (
        <Box sx={{ height: 8 }} />
    );

const SideBar = ({ open = true }) => {
    const location = useLocation();
    const p = location.pathname;

    return (
        <Box>
            <SectionLabel label="MAIN" open={open} />
            <NavItem open={open} to="/" icon={<HomeIcon />} label="Dashboard" active={p === '/' || p === '/Admin/dashboard'} />
            <NavItem open={open} to="/Admin/students" icon={<PersonOutlineIcon />} label="Students" active={p.startsWith('/Admin/students')} />
            <NavItem open={open} to="/Admin/teachers" icon={<SupervisorAccountOutlinedIcon />} label="Teachers" active={p.startsWith('/Admin/teachers')} />
            <NavItem open={open} to="/Admin/classes" icon={<ClassOutlinedIcon />} label="Classes" active={p.startsWith('/Admin/classes')} />
            <NavItem open={open} to="/Admin/subjects" icon={<CheckBoxOutlinedIcon />} label="Attendance" active={p.startsWith('/Admin/subjects')} />
            <NavItem open={open} to="/Admin/fees" icon={<PaymentIcon />} label="Fees" active={p.startsWith('/Admin/fees')} />
            <NavItem open={open} to="/Admin/notices" icon={<AnnouncementOutlinedIcon />} label="Notices" active={p.startsWith('/Admin/notices')} />

            <Divider sx={{ my: 1, borderColor: '#E2E8F0' }} />

            <SectionLabel label="ACCOUNT" open={open} />
            <NavItem open={open} to="/Admin/profile" icon={<AccountCircleOutlinedIcon />} label="Profile" active={p.startsWith('/Admin/profile')} />
            <NavItem open={open} to="/logout" icon={<ExitToAppIcon />} label="Logout" active={p.startsWith('/logout')} />
        </Box>
    );
};

export default SideBar;
