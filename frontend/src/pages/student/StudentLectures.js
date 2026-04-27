import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    LinearProgress,
    IconButton
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Description as TextIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as FileIcon,
    VideoLibrary as VideoIcon,
    Comment as CommentIcon,
    Schedule as TimeIcon,
    Person as PersonIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { lectureAPI } from '../../services/lectureAPI';

const StudentLectures = () => {
    const { currentUser } = useSelector((state) => state.user);
    const [lectures, setLectures] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [openLectureDialog, setOpenLectureDialog] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [watchProgress, setWatchProgress] = useState({});

    useEffect(() => {
        fetchSubjects();
        fetchLectures();
    }, [selectedSubject]);

    const fetchSubjects = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/ClassSubjects/${currentUser.sclassName._id}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setSubjects(data);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchLectures = async () => {
        try {
            setLoading(true);
            const response = await lectureAPI.getStudentLectures(
                currentUser._id, 
                currentUser.sclassName._id, 
                selectedSubject
            );
            if (Array.isArray(response)) {
                setLectures(response);
                // Initialize watch progress
                const progress = {};
                response.forEach(lecture => {
                    const userView = lecture.viewedBy?.find(view => view.student === currentUser._id);
                    progress[lecture._id] = userView ? userView.progress : 0;
                });
                setWatchProgress(progress);
            } else {
                setLectures([]);
            }
        } catch (error) {
            console.error('Error fetching lectures:', error);
            setLectures([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLectureClick = async (lecture) => {
        setSelectedLecture(lecture);
        setComments(lecture.comments || []);
        setOpenLectureDialog(true);
        
        // Track view
        try {
            await lectureAPI.trackLectureView(lecture._id, currentUser._id, 0, 0);
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        try {
            const updatedComments = await lectureAPI.addLectureComment(
                selectedLecture._id,
                currentUser._id,
                newComment.trim()
            );
            setComments(updatedComments);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleProgressUpdate = async (lectureId, progress) => {
        try {
            await lectureAPI.trackLectureView(lectureId, currentUser._id, 0, progress);
            setWatchProgress(prev => ({
                ...prev,
                [lectureId]: progress
            }));
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const getLectureIcon = (type) => {
        switch (type) {
            case 'video': return <VideoIcon color="primary" />;
            case 'pdf': return <PdfIcon color="error" />;
            case 'document': return <FileIcon color="info" />;
            default: return <TextIcon color="success" />;
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const renderLectureContent = (lecture) => {
        if (lecture.lectureType === 'text') {
            return (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {lecture.content?.textContent}
                    </Typography>
                </Box>
            );
        } else if (lecture.content?.filePath) {
            const fileUrl = lectureAPI.getLectureFileUrl(lecture._id);
            
            if (lecture.lectureType === 'video') {
                return (
                    <Box sx={{ mt: 2 }}>
                        <video
                            controls
                            style={{ width: '100%', maxHeight: '400px' }}
                            onTimeUpdate={(e) => {
                                const progress = (e.target.currentTime / e.target.duration) * 100;
                                if (progress > watchProgress[lecture._id]) {
                                    handleProgressUpdate(lecture._id, Math.round(progress));
                                }
                            }}
                        >
                            <source src={fileUrl} type={lecture.content.mimeType} />
                            Your browser does not support the video tag.
                        </video>
                    </Box>
                );
            } else if (lecture.lectureType === 'pdf') {
                return (
                    <Box sx={{ mt: 2 }}>
                        <iframe
                            src={fileUrl}
                            style={{ width: '100%', height: '500px', border: 'none' }}
                            title={lecture.title}
                        />
                    </Box>
                );
            } else {
                return (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            href={fileUrl}
                            target="_blank"
                            startIcon={<FileIcon />}
                        >
                            Download {lecture.content.fileName}
                        </Button>
                    </Box>
                );
            }
        }
        return null;
    };

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>Lectures</Typography>
                    <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>Browse and watch your class lectures</Typography>
                </Box>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Subject</InputLabel>
                    <Select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        label="Filter by Subject"
                        sx={{ borderRadius: '8px', background: '#fff' }}
                    >
                        <MenuItem value="">All Subjects</MenuItem>
                        {subjects.map((subject) => (
                            <MenuItem key={subject._id} value={subject._id}>
                                {subject.subName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {loading ? (
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff' }}>
                    <Typography sx={{ color: '#64748B' }}>Loading lectures...</Typography>
                </Paper>
            ) : lectures.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1E293B', mb: 0.5 }}>No lectures available</Typography>
                    <Typography sx={{ fontSize: 14, color: '#64748B' }}>Your teachers haven't uploaded any lectures yet.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {lectures.map((lecture) => (
                        <Grid item xs={12} md={6} lg={4} key={lecture._id}>
                            <Paper elevation={0} sx={{
                                borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.07)', height: '100%',
                                display: 'flex', flexDirection: 'column',
                                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderColor: '#1E3A8A' },
                                transition: 'all 0.2s',
                            }}>
                                <Box sx={{ p: 2.5, flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Box sx={{ mr: 1 }}>{getLectureIcon(lecture.lectureType)}</Box>
                                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#1E293B', flexGrow: 1 }}>
                                            {lecture.title}
                                        </Typography>
                                    </Box>

                                    <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2, lineHeight: 1.5 }}>
                                        {lecture.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                                        <Chip label={lecture.subject?.subName} size="small"
                                            sx={{ fontSize: 11, bgcolor: '#EFF6FF', color: '#1E3A8A', fontWeight: 500 }} />
                                        <Chip label={lecture.difficulty} size="small" variant="outlined"
                                            sx={{ fontSize: 11, borderColor: '#E2E8F0', color: '#64748B' }} />
                                        {lecture.estimatedDuration > 0 && (
                                            <Chip icon={<TimeIcon sx={{ fontSize: '14px !important' }} />}
                                                label={formatDuration(lecture.estimatedDuration)} size="small" variant="outlined"
                                                sx={{ fontSize: 11, borderColor: '#E2E8F0', color: '#64748B' }} />
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <PersonIcon sx={{ fontSize: 14, color: '#94A3B8', mr: 0.5 }} />
                                        <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>{lecture.teacher?.name}</Typography>
                                    </Box>

                                    {watchProgress[lecture._id] > 0 && (
                                        <Box sx={{ mt: 1.5 }}>
                                            <Typography sx={{ fontSize: 12, color: '#64748B', mb: 0.5 }}>
                                                Progress: {watchProgress[lecture._id]}%
                                            </Typography>
                                            <LinearProgress variant="determinate" value={watchProgress[lecture._id]}
                                                sx={{ borderRadius: 4, height: 6, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#1E3A8A' } }} />
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ px: 2.5, pb: 2.5 }}>
                                    <Button fullWidth variant="contained" startIcon={<PlayIcon />}
                                        onClick={() => handleLectureClick(lecture)}
                                        sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                                        View Lecture
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Lecture Detail Dialog */}
            <Dialog
                open={openLectureDialog}
                onClose={() => setOpenLectureDialog(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { height: '90vh', borderRadius: '12px' } }}
            >
                {selectedLecture && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', pb: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1E293B' }}>{selectedLecture.title}</Typography>
                                <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.3 }}>
                                    {selectedLecture.subject?.subName} • {selectedLecture.teacher?.name}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setOpenLectureDialog(false)} sx={{ color: '#64748B' }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography sx={{ fontSize: 14, color: '#64748B', mb: 2 }}>
                                {selectedLecture.description}
                            </Typography>

                            <Box sx={{ flexGrow: 1, mb: 3 }}>
                                {renderLectureContent(selectedLecture)}
                            </Box>

                            <Box sx={{ mt: 'auto' }}>
                                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CommentIcon sx={{ fontSize: 18 }} />
                                    Comments ({comments.length})
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <TextField fullWidth multiline rows={2} placeholder="Add a comment..."
                                        value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                                    <Button variant="contained" size="small" onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }}>
                                        Add Comment
                                    </Button>
                                </Box>

                                <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                                    {comments.map((comment, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem alignItems="flex-start">
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: '#1E3A8A', width: 32, height: 32, fontSize: 14 }}>
                                                        {comment.student?.name?.charAt(0)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{comment.student?.name}</Typography>}
                                                    secondary={
                                                        <>
                                                            <Typography sx={{ fontSize: 13, color: '#374151', mt: 0.3 }}>{comment.comment}</Typography>
                                                            <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.3 }}>
                                                                {new Date(comment.createdAt).toLocaleString()}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                            {index < comments.length - 1 && <Divider sx={{ borderColor: '#E2E8F0' }} />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default StudentLectures;