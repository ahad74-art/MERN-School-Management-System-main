import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

const iconBox = {
    width: 56, height: 56, borderRadius: '12px', bgcolor: '#EFF6FF',
    display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
};

// ─── Step 1: Enter Email ──────────────────────────────────────────────────────
const StepEmail = ({ onSent }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { setError('Please enter your email address'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) onSent(email);
            else setError(data.message || 'Something went wrong');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={iconBox}><EmailIcon sx={{ color: '#1E3A8A', fontSize: 28 }} /></Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>Forgot Password</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                    Enter your registered email to receive an OTP
                </Typography>
            </Box>
            <form onSubmit={handleSubmit}>
                {error && <Alert severity="error" sx={{ borderRadius: '8px', mb: 2 }}>{error}</Alert>}
                <TextField fullWidth label="Email Address" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                <Button fullWidth type="submit" variant="contained" disabled={loading}
                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.3, fontWeight: 600, fontSize: 15 }}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
                </Button>
            </form>
            <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button onClick={() => navigate('/')} sx={{ textTransform: 'none', color: '#64748B', fontSize: 13 }}>
                    ← Back to Login
                </Button>
            </Box>
        </>
    );
};

// ─── Step 2: Enter OTP ────────────────────────────────────────────────────────
const StepOtp = ({ email, onVerified, onBack }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(600);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [resending, setResending] = useState(false);
    const timerRef = useRef(null);
    const resendRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCountdown(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        resendRef.current = setInterval(() => {
            setResendCooldown(prev => { if (prev <= 1) { clearInterval(resendRef.current); return 0; } return prev - 1; });
        }, 1000);
        return () => clearInterval(resendRef.current);
    }, []);

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) { setError('OTP must be exactly 6 digits'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (data.success) onVerified(data.resetToken);
            else setError(data.message || 'Invalid OTP');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true); setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setCountdown(600); setResendCooldown(60); setOtp('');
                clearInterval(resendRef.current);
                resendRef.current = setInterval(() => {
                    setResendCooldown(prev => { if (prev <= 1) { clearInterval(resendRef.current); return 0; } return prev - 1; });
                }, 1000);
            } else {
                setError(data.message || 'Failed to resend OTP');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={iconBox}><EmailIcon sx={{ color: '#1E3A8A', fontSize: 28 }} /></Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>Enter OTP</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                    We sent a 6-digit OTP to <strong>{email}</strong>
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: countdown < 60 ? '#DC2626' : '#1E3A8A' }}>
                    {countdown > 0 ? `OTP expires in ${fmt(countdown)}` : 'OTP has expired'}
                </Typography>
            </Box>
            <form onSubmit={handleVerify}>
                {error && <Alert severity="error" sx={{ borderRadius: '8px', mb: 2 }}>{error}</Alert>}
                <TextField fullWidth label="6-Digit OTP" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputProps={{ maxLength: 6, style: { letterSpacing: '8px', fontSize: 22, textAlign: 'center', fontWeight: 700 } }}
                    required disabled={countdown === 0}
                    sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                <Button fullWidth type="submit" variant="contained"
                    disabled={loading || countdown === 0 || otp.length !== 6}
                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.3, fontWeight: 600, fontSize: 15 }}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify OTP'}
                </Button>
            </form>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2.5, alignItems: 'center' }}>
                <Button onClick={onBack} sx={{ textTransform: 'none', color: '#64748B', fontSize: 13 }}>
                    ← Change Email
                </Button>
                <Button onClick={handleResend} disabled={resendCooldown > 0 || resending}
                    sx={{ textTransform: 'none', color: '#1E3A8A', fontSize: 13 }}>
                    {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </Button>
            </Box>
        </>
    );
};

// ─── Step 3: Reset Password ───────────────────────────────────────────────────
const StepReset = ({ email, resetToken, onDone }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validate = (p) => /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(p);
    const strength = newPassword.length === 0 ? null
        : !validate(newPassword) ? 'weak'
        : newPassword.length < 10 ? 'medium' : 'strong';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate(newPassword)) { setError('Password must be at least 6 characters with letters and numbers'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, resetToken, newPassword }),
            });
            const data = await res.json();
            if (data.success) onDone();
            else setError(data.message || 'Failed to reset password');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={iconBox}><LockResetIcon sx={{ color: '#1E3A8A', fontSize: 28 }} /></Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>Set New Password</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>Choose a strong password</Typography>
            </Box>
            <form onSubmit={handleSubmit}>
                {error && <Alert severity="error" sx={{ borderRadius: '8px', mb: 2 }}>{error}</Alert>}
                <TextField fullWidth label="New Password" type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} required
                    sx={{ mb: 0.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                {strength && (
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, mt: 0.5, alignItems: 'center' }}>
                        {['weak', 'medium', 'strong'].map((level, i) => (
                            <Box key={level} sx={{
                                flex: 1, height: 4, borderRadius: 2,
                                bgcolor: strength === 'weak' && i === 0 ? '#DC2626'
                                    : strength === 'medium' && i <= 1 ? '#D97706'
                                    : strength === 'strong' ? '#16A34A' : '#E2E8F0',
                            }} />
                        ))}
                        <Typography sx={{ fontSize: 11, ml: 1, minWidth: 40, color: strength === 'weak' ? '#DC2626' : strength === 'medium' ? '#D97706' : '#16A34A' }}>
                            {strength}
                        </Typography>
                    </Box>
                )}
                <TextField fullWidth label="Confirm Password" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required
                    sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                <Button fullWidth type="submit" variant="contained" disabled={loading}
                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.3, fontWeight: 600, fontSize: 15 }}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
                </Button>
            </form>
        </>
    );
};

// ─── Main: orchestrates all 3 steps ──────────────────────────────────────────
const ForgetPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const navigate = useNavigate();

    return (
        <Box sx={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #E2E8F0', background: '#fff', maxWidth: 440, width: '100%' }}>
                {step < 4 && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        {[1, 2, 3].map(s => (
                            <Box key={s} sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: s <= step ? '#1E3A8A' : '#E2E8F0', transition: 'background 0.3s' }} />
                        ))}
                    </Box>
                )}
                {step === 1 && <StepEmail onSent={(e) => { setEmail(e); setStep(2); }} />}
                {step === 2 && <StepOtp email={email} onVerified={(t) => { setResetToken(t); setStep(3); }} onBack={() => setStep(1)} />}
                {step === 3 && <StepReset email={email} resetToken={resetToken} onDone={() => setStep(4)} />}
                {step === 4 && (
                    <Box sx={{ textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 64, color: '#16A34A', mb: 2 }} />
                        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 1 }}>Password Reset!</Typography>
                        <Typography sx={{ fontSize: 14, color: '#64748B', mb: 3 }}>Your password has been updated successfully.</Typography>
                        <Button fullWidth variant="contained" onClick={() => navigate('/')}
                            sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.3, fontWeight: 600 }}>
                            Go to Login
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default ForgetPassword;
