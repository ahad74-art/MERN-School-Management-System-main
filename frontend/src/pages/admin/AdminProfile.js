import React, { useState } from 'react';
import { Card, CardContent, Typography, Grid, Box, Avatar, Container, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../redux/userRelated/userHandle';
import EditIcon from '@mui/icons-material/Edit';

const AdminProfile = () => {
    const { currentUser, response, error, loading } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    
    const [open, setOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        schoolName: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        password: ''
    });

    // Update form data when currentUser changes
    React.useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                schoolName: currentUser.schoolName || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '',
                gender: currentUser.gender || '',
                password: ''
            });
        }
    }, [currentUser]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = () => {
        if (!currentUser || !currentUser._id) {
            setSnackbarMessage('User not found. Please log in again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        const updateData = { ...formData };
        if (!updateData.password) {
            delete updateData.password;
        }
        
        dispatch(updateUser(updateData, currentUser._id, "Admin"));
        setOpen(false);
        setSnackbarMessage('Profile updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                schoolName: currentUser.schoolName || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '',
                gender: currentUser.gender || '',
                password: ''
            });
        }
    };

    if (response) { console.log(response) }
    else if (error) { console.log(error) }

    // Show loading or error state if currentUser is not available
    if (!currentUser) {
        return (
            <Container maxWidth="md">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6">Loading profile...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <>
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 3 }}>My Profile</Typography>
                <Container maxWidth="md" disableGutters>
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="center">
                                <Avatar alt="Admin Avatar" sx={{ width: 100, height: 100, bgcolor: '#1E3A8A', fontSize: 36 }}>
                                    {String(currentUser.name).charAt(0)}
                                </Avatar>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center" gap={0.5}>
                                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1E293B' }}>{currentUser.name}</Typography>
                                <Typography sx={{ fontSize: 14, color: '#64748B' }}>{currentUser.email}</Typography>
                                <Typography sx={{ fontSize: 14, color: '#64748B' }}>{currentUser.schoolName}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="center">
                                <Button variant="contained" startIcon={<EditIcon />} onClick={() => setOpen(true)}
                                    sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', mt: 1 }}>
                                    Edit Profile
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
                <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff' }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1E293B', mb: 2 }}>Personal Information</Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Date of Birth', value: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toLocaleDateString() : 'Not provided' },
                            { label: 'Gender', value: currentUser.gender || 'Not provided' },
                            { label: 'Phone', value: currentUser.phone || 'Not provided' },
                            { label: 'Address', value: currentUser.address || 'Not provided' },
                        ].map(({ label, value }) => (
                            <Grid item xs={12} sm={6} key={label}>
                                <Typography sx={{ fontSize: 12, color: '#94A3B8', mb: 0.5 }}>{label}</Typography>
                                <Typography sx={{ fontSize: 14, color: '#1E293B', fontWeight: 500 }}>{value}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
                </Container>
            </Box>

            {/* Edit Profile Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="School Name"
                                name="schoolName"
                                value={formData.schoolName}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Gender"
                                name="gender"
                                select
                                SelectProps={{ native: true }}
                                value={formData.gender}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                multiline
                                rows={2}
                                value={formData.address}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password (leave blank to keep current)"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    )
}

export default AdminProfile