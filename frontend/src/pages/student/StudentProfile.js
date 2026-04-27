import React, { useState } from 'react';
import {
    Typography, Grid, Box, Avatar, Paper, Button,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, Container
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../redux/userRelated/userHandle';
import EditIcon from '@mui/icons-material/Edit';

const StudentProfile = () => {
    const { currentUser, response, error, loading } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '',
        dateOfBirth: '', gender: '', emergencyContact: '', password: ''
    });

    React.useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '', email: currentUser.email || '',
                phone: currentUser.phone || '', address: currentUser.address || '',
                dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '',
                gender: currentUser.gender || '', emergencyContact: currentUser.emergencyContact || '',
                password: ''
            });
        }
    }, [currentUser]);

    const handleSubmit = () => {
        if (!currentUser?._id) { setSnackbar({ open: true, message: 'User not found.', severity: 'error' }); return; }
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        dispatch(updateUser(updateData, currentUser._id, "Student"));
        setOpen(false);
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    };

    const handleClose = () => {
        setOpen(false);
        if (currentUser) setFormData({
            name: currentUser.name || '', email: currentUser.email || '',
            phone: currentUser.phone || '', address: currentUser.address || '',
            dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '',
            gender: currentUser.gender || '', emergencyContact: currentUser.emergencyContact || '',
            password: ''
        });
    };

    if (!currentUser) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography>Loading profile...</Typography>
        </Box>
    );

    const infoFields = [
        { label: 'Date of Birth', value: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toLocaleDateString() : 'Not provided' },
        { label: 'Gender', value: currentUser.gender || 'Not provided' },
        { label: 'Email', value: currentUser.email || 'Not provided' },
        { label: 'Phone', value: currentUser.phone || 'Not provided' },
        { label: 'Address', value: currentUser.address || 'Not provided' },
        { label: 'Emergency Contact', value: currentUser.emergencyContact || 'Not provided' },
    ];

    return (
        <>
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 3 }}>My Profile</Typography>
                <Container maxWidth="md" disableGutters>
                    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', textAlign: 'center' }}>
                        <Avatar sx={{ width: 90, height: 90, bgcolor: '#1E3A8A', fontSize: 32, mx: 'auto', mb: 1.5 }}>
                            {currentUser.name?.charAt(0)}
                        </Avatar>
                        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1E293B' }}>{currentUser.name}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.5 }}>Roll No: {currentUser.rollNum}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#64748B' }}>Class: {currentUser.sclassName?.sclassName || 'Not assigned'}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#64748B' }}>School: {currentUser.school?.schoolName || 'Not assigned'}</Typography>
                        <Button variant="contained" startIcon={<EditIcon />} onClick={() => setOpen(true)}
                            sx={{ mt: 2, bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                            Edit Profile
                        </Button>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff' }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1E293B', mb: 2 }}>Personal Information</Typography>
                        <Grid container spacing={2}>
                            {infoFields.map(({ label, value }) => (
                                <Grid item xs={12} sm={6} key={label}>
                                    <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 0.5 }}>{label}</Typography>
                                    <Typography sx={{ fontSize: 14, color: '#1E293B', fontWeight: 500 }}>{value}</Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Container>
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit Profile</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        {[
                            { label: 'Name', name: 'name', type: 'text' },
                            { label: 'Email', name: 'email', type: 'email' },
                            { label: 'Phone', name: 'phone', type: 'text' },
                            { label: 'Emergency Contact', name: 'emergencyContact', type: 'text' },
                        ].map(({ label, name, type }) => (
                            <Grid item xs={12} sm={6} key={name}>
                                <TextField fullWidth label={label} name={name} type={type}
                                    value={formData[name]} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            </Grid>
                        ))}
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Date of Birth" name="dateOfBirth" type="date"
                                value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth select label="Gender" name="gender" value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                SelectProps={{ native: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Address" name="address" multiline rows={2}
                                value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="New Password (leave blank to keep current)" name="password" type="password"
                                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}
                        sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                        {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default StudentProfile;
