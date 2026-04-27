import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useParams } from 'react-router-dom';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [tokenValid, setTokenValid] = useState(null); // null=checking, true, false
    const [userName, setUserName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    // Validate token on mount
    useEffect(() => {
        fetch(`${process.env.REACT_APP_BASE_URL}/reset-password/validate/${token}`)
            .then(r => r.json())
            .then(data => {
                setTokenValid(data.valid);
                if (data.valid) setUserName(data.name);
            })
            .catch(() => setTokenValid(false));
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setDone(true);
                setTimeout(() => navigate('/'), 3000);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Checking token
    if (tokenValid === null) return (
        <Box sx={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#1E3A8A' }} />
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #E2E8F0', background: '#fff', maxWidth: 440, width: '100%' }}>

                {!tokenValid ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <Alert severity="error" sx={{ borderRadius: '8px', mb: 3 }}>
                            This reset link is invalid or has expired.
                        </Alert>
                        <Button variant="contained" onClick={() => navigate('/forgot-password')}
                            sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                            Request a new link
                        </Button>
                    </Box>
                ) : done ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 64, color: '#16A34A', mb: 2 }} />
                        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 1 }}>Password Reset!</Typography>
                        <Typography sx={{ fontSize: 14, color: '#64748B', mb: 3 }}>
                            Redirecting to login in 3 seconds...
                        </Typography>
                        <Button variant="contained" onClick={() => navigate('/')}
                            sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                            Go to Login
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{ width: 56, height: 56, borderRadius: '12px', bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                                <LockResetIcon sx={{ color: '#1E3A8A', fontSize: 28 }} />
                            </Box>
                            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>Set New Password</Typography>
                            {userName && (
                                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>Hello, {userName}</Typography>
                            )}
                        </Box>

                        <form onSubmit={handleSubmit}>
                            {error && <Alert severity="error" sx={{ borderRadius: '8px', mb: 2 }}>{error}</Alert>}
                            <TextField fullWidth label="New Password" type="password" value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} required
                                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField fullWidth label="Confirm New Password" type="password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} required
                                sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <Button fullWidth type="submit" variant="contained" disabled={loading}
                                sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.3, fontWeight: 600, fontSize: 15 }}>
                                {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
                            </Button>
                        </form>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default ResetPassword;
