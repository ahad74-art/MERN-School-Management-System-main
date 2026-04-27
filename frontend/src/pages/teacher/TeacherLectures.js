import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    Grid,
    Card,
    CardContent,
    CardActions,
    Tooltip,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    VideoLibrary as VideoIcon,
    Description as TextIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as FileIcon,
    Analytics as AnalyticsIcon,
    Publish as PublishIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { lectureAPI } from '../../services/lectureAPI';

const TeacherLectures = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [lectures, setLectures] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingLecture, setEditingLecture] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [analytics, setAnalytics] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        lectureType: 'text',
        textContent: '',
        difficulty: 'Beginner',
        estimatedDuration: '',
        tags: '',
        isPublished: false,
        lectureFile: null
    });

    useEffect(() => {
        fetchLectures();
        fetchSubjects();
        fetchAnalytics();
    }, []);

    const fetchLectures = async () => {
        try {
            setLoading(true);
            const response = await lectureAPI.getTeacherLectures(currentUser._id);
            if (Array.isArray(response)) {
                setLectures(response);
            } else {
                setLectures([]);
            }
        } catch (error) {
            console.error('Error fetching lectures:', error);
            showSnackbar('Error fetching lectures', 'error');
            setLectures([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            // Get subjects for the teacher's class
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/ClassSubjects/${currentUser.teachSclass._id}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await lectureAPI.getLectureAnalytics(currentUser._id);
            setAnalytics(response);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            lectureFile: e.target.files[0]
        }));
    };

    const handleSubmit = async () => {
        try {
            // Check if currentUser has required fields
            if (!currentUser || !currentUser._id || !currentUser.teachSclass?._id || !currentUser.school?._id) {
                showSnackbar('User information is incomplete. Please refresh and try again.', 'error');
                return;
            }

            // Validate required fields
            if (!formData.title || !formData.description || !formData.subject || !formData.lectureType) {
                showSnackbar('Please fill in all required fields', 'error');
                return;
            }

            if (formData.lectureType === 'text' && !formData.textContent) {
                showSnackbar('Please provide text content for text lectures', 'error');
                return;
            }

            if (formData.lectureType !== 'text' && !formData.lectureFile && !editingLecture) {
                showSnackbar('Please select a file for non-text lectures', 'error');
                return;
            }

            const submitData = {
                ...formData,
                teacher: currentUser._id,
                sclass: currentUser.teachSclass._id,
                school: currentUser.school._id
            };

            if (editingLecture) {
                await lectureAPI.updateLecture(editingLecture._id, submitData);
                showSnackbar('Lecture updated successfully', 'success');
            } else {
                await lectureAPI.createLecture(submitData);
                showSnackbar('Lecture created successfully', 'success');
            }

            handleCloseDialog();
            fetchLectures();
            fetchAnalytics();
        } catch (error) {
            console.error('Error saving lecture:', error);
            showSnackbar(error.response?.data?.message || 'Error saving lecture', 'error');
        }
    };

    const handleEdit = (lecture) => {
        setEditingLecture(lecture);
        setFormData({
            title: lecture.title,
            description: lecture.description,
            subject: lecture.subject._id,
            lectureType: lecture.lectureType,
            textContent: lecture.content?.textContent || '',
            difficulty: lecture.difficulty,
            estimatedDuration: lecture.estimatedDuration,
            tags: lecture.tags?.join(', ') || '',
            isPublished: lecture.isPublished,
            lectureFile: null
        });
        setOpenDialog(true);
    };

    const handleDelete = async (lectureId) => {
        if (window.confirm('Are you sure you want to delete this lecture?')) {
            try {
                await lectureAPI.deleteLecture(lectureId);
                showSnackbar('Lecture deleted successfully', 'success');
                fetchLectures();
                fetchAnalytics();
            } catch (error) {
                console.error('Error deleting lecture:', error);
                showSnackbar('Error deleting lecture', 'error');
            }
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingLecture(null);
        setFormData({
            title: '',
            description: '',
            subject: '',
            lectureType: 'text',
            textContent: '',
            difficulty: 'Beginner',
            estimatedDuration: '',
            tags: '',
            isPublished: false,
            lectureFile: null
        });
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const getLectureIcon = (type) => {
        switch (type) {
            case 'video': return <VideoIcon />;
            case 'pdf': return <PdfIcon />;
            case 'document': return <FileIcon />;
            default: return <TextIcon />;
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    My Lectures
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<AnalyticsIcon />}
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        sx={{ mr: 2 }}
                    >
                        Analytics
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                    >
                        Create Lecture
                    </Button>
                </Box>
            </Box>

            {/* Analytics Section */}
            {showAnalytics && analytics && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Lectures
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.totalLectures}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Views
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.totalViews}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Watch Time
                                </Typography>
                                <Typography variant="h4">
                                    {formatDuration(analytics.totalWatchTime)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Avg. Completion
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.lectureStats.length > 0 
                                        ? (analytics.lectureStats.reduce((sum, stat) => sum + parseFloat(stat.completionRate), 0) / analytics.lectureStats.length).toFixed(1)
                                        : 0}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Lectures Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Views</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">Loading...</TableCell>
                            </TableRow>
                        ) : lectures.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">No lectures found</TableCell>
                            </TableRow>
                        ) : (
                            lectures.map((lecture) => (
                                <TableRow key={lecture._id}>
                                    <TableCell>
                                        <Tooltip title={lecture.lectureType}>
                                            {getLectureIcon(lecture.lectureType)}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">{lecture.title}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {lecture.description.substring(0, 50)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{lecture.subject?.subName}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={lecture.isPublished ? 'Published' : 'Draft'}
                                            color={lecture.isPublished ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{lecture.viewCount}</TableCell>
                                    <TableCell>
                                        {new Date(lecture.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(lecture)} size="small">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(lecture._id)} size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingLecture ? 'Edit Lecture' : 'Create New Lecture'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="title"
                                label="Title"
                                value={formData.title}
                                onChange={handleInputChange}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    label="Subject"
                                >
                                    {subjects.map((subject) => (
                                        <MenuItem key={subject._id} value={subject._id}>
                                            {subject.subName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Lecture Type</InputLabel>
                                <Select
                                    name="lectureType"
                                    value={formData.lectureType}
                                    onChange={handleInputChange}
                                    label="Lecture Type"
                                >
                                    <MenuItem value="text">Text Content</MenuItem>
                                    <MenuItem value="video">Video</MenuItem>
                                    <MenuItem value="pdf">PDF Document</MenuItem>
                                    <MenuItem value="document">Document</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {formData.lectureType === 'text' ? (
                            <Grid item xs={12}>
                                <TextField
                                    name="textContent"
                                    label="Lecture Content"
                                    value={formData.textContent}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={6}
                                    required
                                />
                            </Grid>
                        ) : (
                            <Grid item xs={12}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept={
                                        formData.lectureType === 'video' ? 'video/*' :
                                        formData.lectureType === 'pdf' ? '.pdf' :
                                        '.doc,.docx,.ppt,.pptx'
                                    }
                                    style={{ width: '100%', padding: '10px' }}
                                />
                            </Grid>
                        )}
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Difficulty</InputLabel>
                                <Select
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleInputChange}
                                    label="Difficulty"
                                >
                                    <MenuItem value="Beginner">Beginner</MenuItem>
                                    <MenuItem value="Intermediate">Intermediate</MenuItem>
                                    <MenuItem value="Advanced">Advanced</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="estimatedDuration"
                                label="Estimated Duration (minutes)"
                                type="number"
                                value={formData.estimatedDuration}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="tags"
                                label="Tags (comma separated)"
                                value={formData.tags}
                                onChange={handleInputChange}
                                fullWidth
                                placeholder="e.g. mathematics, algebra, equations"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isPublished}
                                        onChange={handleInputChange}
                                        name="isPublished"
                                    />
                                }
                                label="Publish immediately"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingLecture ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TeacherLectures;