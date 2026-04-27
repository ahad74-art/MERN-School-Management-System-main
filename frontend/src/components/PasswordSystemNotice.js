import React, { useState } from 'react';
import {
    Alert,
    AlertTitle,
    Collapse,
    IconButton,
    Box,
    Typography,
    Button
} from '@mui/material';
import { Close, Security, CheckCircle } from '@mui/icons-material';

const PasswordSystemNotice = () => {
    const [open, setOpen] = useState(true);

    if (!open) return null;

    return (
        <Box sx={{ mb: 2 }}>
            <Collapse in={open}>
                <Alert
                    severity="success"
                    icon={<Security />}
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setOpen(false)}
                        >
                            <Close fontSize="inherit" />
                        </IconButton>
                    }
                >
                    <AlertTitle>Password System Updated</AlertTitle>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        The password system has been enhanced for better security:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                        <li>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CheckCircle fontSize="small" color="success" />
                                <Typography variant="body2">
                                    All passwords now use secure bcrypt encryption
                                </Typography>
                            </Box>
                        </li>
                        <li>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CheckCircle fontSize="small" color="success" />
                                <Typography variant="body2">
                                    Password reset functionality works for all user types
                                </Typography>
                            </Box>
                        </li>
                        <li>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CheckCircle fontSize="small" color="success" />
                                <Typography variant="body2">
                                    Login system properly validates encrypted passwords
                                </Typography>
                            </Box>
                        </li>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        If you recently reset your password, you can now log in normally.
                    </Typography>
                </Alert>
            </Collapse>
        </Box>
    );
};

export default PasswordSystemNotice;