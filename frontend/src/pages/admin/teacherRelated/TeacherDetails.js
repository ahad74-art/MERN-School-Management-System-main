import React, { useEffect, useState } from 'react';
import { getTeacherDetails } from '../../../redux/teacherRelated/teacherHandle';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Button, 
    Container, 
    Typography, 
    Box, 
    Chip, 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const TeacherDetails = () => {
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useDispatch();
    const { loading, teacherDetails, error } = useSelector((state) => state.teacher);
    const { classList } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);

    const teacherID = params.id;
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [availableClasses, setAvailableClasses] = useState([]);

    useEffect(() => {
        dispatch(getTeacherDetails(teacherID));
    }, [dispatch, teacherID]);

    useEffect(() => {
        // Fetch all classes for the school
        if (currentUser?._id) {
            fetch(`${process.env.REACT_APP_BASE_URL}/Sclasses/${currentUser._id}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setAvailableClasses(data);
                    }
                })
                .catch(err => console.error('Error fetching classes:', err));
        }
    }, [currentUser]);

    if (error) {
        console.log(error);
    }

    const isSubjectNamePresent = teacherDetails?.teachSubject?.subName;
    const teacherClasses = Array.isArray(teacherDetails?.teachSclass) 
        ? teacherDetails.teachSclass 
        : teacherDetails?.teachSclass ? [teacherDetails.teachSclass] : [];

    const handleAddSubject = () => {
        const firstClassId = teacherClasses[0]?._id;
        if (firstClassId) {
            navigate(`/Admin/teachers/choosesubject/${firstClassId}/${teacherDetails?._id}`);
        }
    };

    const handleAddClass = async () => {
        if (!selectedClass) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/TeacherAddClass`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: teacherID,
                    classId: selectedClass
                })
            });
            const data = await response.json();
            if (data.message) {
                alert(data.message);
            } else {
                dispatch(getTeacherDetails(teacherID));
                setOpenDialog(false);
                setSelectedClass('');
            }
        } catch (error) {
            console.error('Error adding class:', error);
            alert('Failed to add class');
        }
    };

    const handleRemoveClass = async (classId) => {
        if (teacherClasses.length === 1) {
            alert('Teacher must have at least one class assigned');
            return;
        }

        if (!window.confirm('Are you sure you want to remove this class?')) {
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/TeacherRemoveClass`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: teacherID,
                    classId: classId
                })
            });
            await response.json();
            dispatch(getTeacherDetails(teacherID));
        } catch (error) {
            console.error('Error removing class:', error);
            alert('Failed to remove class');
        }
    };

    const unassignedClasses = availableClasses.filter(
        cls => !teacherClasses.some(tc => tc._id === cls._id)
    );

    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <Container>
                    <Typography variant="h4" align="center" gutterBottom>
                        Teacher Details
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        Teacher Name: {teacherDetails?.name}
                    </Typography>
                    
                    <Box sx={{ mt: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6">
                                Assigned Classes:
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenDialog(true)}
                            >
                                Add Class
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {teacherClasses.length > 0 ? (
                                teacherClasses.map((cls) => (
                                    <Chip
                                        key={cls._id}
                                        label={cls.sclassName}
                                        onDelete={() => handleRemoveClass(cls._id)}
                                        deleteIcon={<DeleteIcon />}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))
                            ) : (
                                <Typography color="text.secondary">
                                    No classes assigned
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {isSubjectNamePresent ? (
                        <>
                            <Typography variant="h6" gutterBottom>
                                Subject Name: {teacherDetails?.teachSubject?.subName}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                Subject Sessions: {teacherDetails?.teachSubject?.sessions}
                            </Typography>
                        </>
                    ) : (
                        <Button variant="contained" onClick={handleAddSubject}>
                            Add Subject
                        </Button>
                    )}

                    {/* Add Class Dialog */}
                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                        <DialogTitle>Add Class to Teacher</DialogTitle>
                        <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Select Class</InputLabel>
                                <Select
                                    value={selectedClass}
                                    label="Select Class"
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    {unassignedClasses.length > 0 ? (
                                        unassignedClasses.map((cls) => (
                                            <MenuItem key={cls._id} value={cls._id}>
                                                {cls.sclassName}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>No classes available</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                            <Button onClick={handleAddClass} variant="contained">
                                Add
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            )}
        </>
    );
};

export default TeacherDetails;