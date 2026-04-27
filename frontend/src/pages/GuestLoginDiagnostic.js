import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Alert,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

const GuestLoginDiagnostic = () => {
    const [serverStatus, setServerStatus] = useState('checking');
    const [guestAccountsStatus, setGuestAccountsStatus] = useState('che