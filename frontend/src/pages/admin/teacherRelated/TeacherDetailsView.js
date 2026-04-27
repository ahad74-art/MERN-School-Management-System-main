import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Box,
    Avatar,
    Chip,
    Button,
    Card,
    CardContent,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Visibility,
    VisibilityOff,
    Person,
    School,
    Email,
    Phone,
    Home,
    CalendarToday,
    Badge,
    Class,
    Subject
} from '@mui/icons-material';
import { getTeacherDetails, updateTeacher } from '../../../redux/teacherRelated/teacherHandle';
import PasswordUpdateDialog from '../../../components/PasswordUpdateDialog';
import DatabaseUpdateVerifier from '../../../components/DatabaseUpdateVerifier';

const TeacherDetailsView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { teacherDetails, loading, error } = useSelector((state) => state.teacher);
    const [showPassword, setShowPassword] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [verifierDialogOpen, setVerifierDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [updateMessage, setUpdateMessage] = useState('');

    useEffect(() => {
        if (id) {
            dispatch(getTeacherDetails(id));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (teacherDetails) {
            setEditFormData({
                name: teacherDetails.name || '',
                email: teacherDetails.email || '',
                phone: teacherDetails.phone || '',
                address: teacherDetails.address || '',
                dateOfBirth: teacherDetails.dateOfBirth ? teacherDetails.dateOfBirth.split('T')[0] : '',
                gender: teacherDetails.gender || '',
                password: '' // Always start with empty password field
            });
        }
    }, [teacherDetails]);

    const handlePasswordUpdate = (newPassword) => {
        const updateData = { password: newPassword };
        dispatch(updateTeacher(updateData, id));
        setUpdateMessage('Password updated successfully!');
        
        // Refresh the data after update
        setTimeout(() => {
            dispatch(getTeacherDetails(id));
            setUpdateMessage('');
        }, 1000);
    };

    const handleEditSubmit = () => {
        const updateData = { ...editFormData };
        // Remove password field if it's empty (don't update password)
        if (!updateData.password || updateData.password.trim() === '') {
            delete updateData.password;
        }
        
        dispatch(updateTeacher(updateData, id));
        setEditDialogOpen(false);
        setUpdateMessage('Teacher information updated successfully!');
        
        // Refresh the data after update
        setTimeout(() => {
            dispatch(getTeacherDetails(id));
            setUpdateMessage('');
        }, 1000);
    };

    if (loading) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6">Loading teacher details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error || !teacherDetails) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6" color="error">
                        {error || 'Teacher not found'}
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => navigate('/Admin/teachers')} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" component="h1">
                    Teacher Details
                </Typography>
            </Box>

            {updateMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {updateMessage}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Profile Card */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar
                                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: '3rem' }}
                            >
                                {teacherDetails.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="h5" gutterBottom>
                                {teacherDetails.name}
                            </Typography>
                            <Chip 
                                label={teacherDetails.role} 
                                color="primary" 
                                sx={{ mb: 2 }}
                            />
                            <Box>
                                <Button
                                    variant="contained"
                                    startIcon={<Edit />}
                                    onClick={() => setEditDialogOpen(true)}
                                    sx={{ mr: 1 }}
                                >
                                    Edit Details
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setVerifierDialogOpen(true)}
                                    size="small"
                                >
                                    Verify DB
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Details Cards */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Basic Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Email
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.email || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Gender
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.gender || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Date of Birth
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.dateOfBirth ? 
                                                    new Date(teacherDetails.dateOfBirth).toLocaleDateString() : 
                                                    'Not provided'
                                                }
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Phone
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.phone || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="textSecondary">
                                                Address
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.address || 'Not provided'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Teaching Information */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Teaching Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                School
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.school?.schoolName || 'Not assigned'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Class
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.teachSclass?.sclassName || 'Not assigned'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="textSecondary">
                                                Subject
                                            </Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {teacherDetails.teachSubject?.subName || 'Not assigned'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Security Information */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        <Badge sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Security Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} sm={8}>
                                            <Typography variant="body2" color="textSecondary">
                                                Password
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                                {showPassword ? teacherDetails.password : '••••••••••••'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box display="flex" gap={1}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={showPassword ? <VisibilityOff /> : <Visibility />}
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? 'Hide' : 'Show'}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="secondary"
                                                    onClick={() => setPasswordDialogOpen(true)}
                                                >
                                                    Change Password
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Teacher Information</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={editFormData.name || ''}
                                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={editFormData.email || ''}
                                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={editFormData.phone || ''}
                                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                type="date"
                                value={editFormData.dateOfBirth || ''}
                                onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Gender"
                                select
                                SelectProps={{ native: true }}
                                value={editFormData.gender || ''}
                                onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
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
                                multiline
                                rows={2}
                                value={editFormData.address || ''}
                                onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password (leave blank to keep current)"
                                type="password"
                                value={editFormData.password || ''}
                                onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                                helperText="Leave blank if you don't want to change the password"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained">
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Password Update Dialog */}
            <PasswordUpdateDialog
                open={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
                onUpdate={handlePasswordUpdate}
                userType="Teacher"
                userName={teacherDetails?.name}
                loading={loading}
            />

            {/* Database Update Verifier */}
            <DatabaseUpdateVerifier
                open={verifierDialogOpen}
                onClose={() => setVerifierDialogOpen(false)}
                userId={id}
                userType="teacher"
                userName={teacherDetails?.name}
            />
        </Container>
    );
};

export default TeacherDetailsView;