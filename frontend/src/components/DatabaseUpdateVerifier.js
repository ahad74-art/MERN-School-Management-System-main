import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import axios from 'axios';

const DatabaseUpdateVerifier = ({ 
    open, 
    onClose, 
    userId, 
    userType, 
    userName 
}) => {
    const [loading, setLoading] = useState(false);
    const [verificationData, setVerificationData] = useState(null);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        setVerificationData(null);

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/verifyUpdate/${userType}/${userId}`
            );
            
            if (response.data.user) {
                setVerificationData(response.data.user);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to verify database update');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setVerificationData(null);
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Database Update Verification
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Verify that updates for <strong>{userName}</strong> ({userType}) 
                        are properly saved to the database.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {verificationData && (
                        <Box sx={{ mb: 2 }}>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Database verification successful!
                            </Alert>
                            
                            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Current Database Record:
                                </Typography>
                                <Typography variant="body2">
                                    <strong>ID:</strong> {verificationData.id}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {verificationData.name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Email:</strong> {verificationData.email || 'Not provided'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Role:</strong> 
                                    <Chip 
                                        label={verificationData.role} 
                                        size="small" 
                                        sx={{ ml: 1 }} 
                                    />
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Last Updated:</strong> {' '}
                                    {new Date(verificationData.lastUpdated).toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {loading && (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ my: 3 }}>
                            <CircularProgress size={24} sx={{ mr: 2 }} />
                            <Typography>Verifying database...</Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    Close
                </Button>
                <Button 
                    onClick={handleVerify} 
                    variant="contained" 
                    disabled={loading}
                >
                    {loading ? 'Verifying...' : 'Verify Database'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DatabaseUpdateVerifier;