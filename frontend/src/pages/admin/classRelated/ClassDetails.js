import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { getClassDetails, getClassStudents, getSubjectList } from "../../../redux/sclassRelated/sclassHandle";
import {
    Box, Container, Typography, Tab, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { BlueButton, GreenButton, PurpleButton } from "../../../components/buttonStyles";
import TableTemplate from "../../../components/TableTemplate";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SpeedDialTemplate from "../../../components/SpeedDialTemplate";
import Popup from "../../../components/Popup";
import DeleteIcon from "@mui/icons-material/Delete";
import PostAddIcon from '@mui/icons-material/PostAdd';

const ClassDetails = () => {
    const params = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { subjectsList, sclassStudents, sclassDetails, loading, error, response, getresponse } = useSelector((state) => state.sclass);

    const classID = params.id
    
    // Get tab from URL query parameter
    const searchParams = new URLSearchParams(window.location.search);
    const tabFromUrl = searchParams.get('tab') || '1';

    const [value, setValue] = useState(tabFromUrl);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        dispatch(getClassDetails(classID, "Sclass"));
        dispatch(getSubjectList(classID, "ClassSubjects"))
        dispatch(getClassStudents(classID));
    }, [dispatch, classID])

    if (error) {
        console.log(error)
    }

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const deleteHandler = (deleteID, address) => {
        console.log(deleteID);
        console.log(address);
        setMessage("Sorry the delete function has been disabled for now.")
        setShowPopup(true)
        // dispatch(deleteUser(deleteID, address))
        //     .then(() => {
        //         dispatch(getClassStudents(classID));
        //         dispatch(resetSubjects())
        //         dispatch(getSubjectList(classID, "ClassSubjects"))
        //     })
    }

    const subjectColumns = [
        { id: 'name', label: 'Subject Name', minWidth: 170 },
        { id: 'code', label: 'Subject Code', minWidth: 100 },
    ]

    const subjectRows = subjectsList && subjectsList.length > 0 && subjectsList.map((subject) => {
        return {
            name: subject.subName,
            code: subject.subCode,
            id: subject._id,
        };
    })

    const SubjectsButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Subject")}>
                    <DeleteIcon color="error" />
                </IconButton>
                <BlueButton
                    variant="contained"
                    onClick={() => {
                        navigate(`/Admin/class/subject/${classID}/${row.id}`)
                    }}
                >
                    View
                </BlueButton >
            </>
        );
    };

    const subjectActions = [
        {
            icon: <PostAddIcon color="primary" />, name: 'Add New Subject',
            action: () => navigate("/Admin/addsubject/" + classID)
        },
        {
            icon: <DeleteIcon color="error" />, name: 'Delete All Subjects',
            action: () => deleteHandler(classID, "SubjectsClass")
        }
    ];

    const ClassSubjectsSection = () => {
        return (
            <>
                {response ?
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <GreenButton
                            variant="contained"
                            onClick={() => navigate("/Admin/addsubject/" + classID)}
                        >
                            Add Subjects
                        </GreenButton>
                    </Box>
                    :
                    <>
                        <Typography variant="h5" gutterBottom>
                            Subjects List:
                        </Typography>

                        <TableTemplate buttonHaver={SubjectsButtonHaver} columns={subjectColumns} rows={subjectRows} />
                        <SpeedDialTemplate actions={subjectActions} />
                    </>
                }
            </>
        )
    }

    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
    ]

    const studentRows = sclassStudents.map((student) => {
        return {
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        };
    })

    const StudentsButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Student")}>
                    <PersonRemoveIcon color="error" />
                </IconButton>
                <BlueButton
                    variant="contained"
                    onClick={() => navigate("/Admin/students/student/" + row.id)}
                >
                    View
                </BlueButton>
                <PurpleButton
                    variant="contained"
                    onClick={() =>
                        navigate("/Admin/students/student/attendance/" + row.id)
                    }
                >
                    Attendance
                </PurpleButton>
            </>
        );
    };

    const studentActions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: 'Add New Student',
            action: () => navigate("/Admin/class/addstudents/" + classID)
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: 'Delete All Students',
            action: () => deleteHandler(classID, "StudentsClass")
        },
    ];

    const ClassStudentsSection = () => {
        return (
            <>
                {getresponse ? (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <GreenButton
                                variant="contained"
                                onClick={() => navigate("/Admin/class/addstudents/" + classID)}
                            >
                                Add Students
                            </GreenButton>
                        </Box>
                    </>
                ) : (
                    <>
                        <Typography variant="h5" gutterBottom>
                            Students List:
                        </Typography>

                        <TableTemplate buttonHaver={StudentsButtonHaver} columns={studentColumns} rows={studentRows} />
                        <SpeedDialTemplate actions={studentActions} />
                    </>
                )}
            </>
        )
    }

    const ClassTeachersSection = () => {
        const [teachers, setTeachers] = useState([]);
        const [loadingTeachers, setLoadingTeachers] = useState(true);
        const [openAssignDialog, setOpenAssignDialog] = useState(false);
        const [selectedTeacher, setSelectedTeacher] = useState(null);
        const [selectedSubject, setSelectedSubject] = useState('');
        const { currentUser } = useSelector((state) => state.user);

        const fetchTeachers = useCallback(async () => {
            try {
                setLoadingTeachers(true);
                const response = await fetch(
                    `${process.env.REACT_APP_BASE_URL}/Teachers/${currentUser._id}`
                );
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTeachers(data);
                } else {
                    setTeachers([]);
                }
            } catch (error) {
                console.error('Error fetching teachers:', error);
                setTeachers([]);
            } finally {
                setLoadingTeachers(false);
            }
        }, [currentUser._id]);

        useEffect(() => {
            fetchTeachers();
        }, [fetchTeachers]);

        const handleOpenAssignDialog = (teacher) => {
            setSelectedTeacher(teacher);
            setSelectedSubject(teacher.teachSubject?._id || '');
            setOpenAssignDialog(true);
        };

        const handleAssignClass = async () => {
            if (!selectedTeacher) return;

            try {
                // First assign the class
                const classResponse = await fetch(
                    `${process.env.REACT_APP_BASE_URL}/TeacherAddClass`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            teacherId: selectedTeacher.id,
                            classId: classID
                        })
                    }
                );
                const classData = await classResponse.json();
                
                if (classData.message) {
                    setMessage(classData.message);
                    setShowPopup(true);
                    setOpenAssignDialog(false);
                    return;
                }

                // If subject is selected and different from current, update it
                if (selectedSubject && selectedSubject !== selectedTeacher.teachSubject?._id) {
                    const subjectResponse = await fetch(
                        `${process.env.REACT_APP_BASE_URL}/TeacherSubject`,
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                teacherId: selectedTeacher.id,
                                teachSubject: selectedSubject
                            })
                        }
                    );
                    await subjectResponse.json();
                }

                setMessage('Teacher assigned successfully!');
                setShowPopup(true);
                setOpenAssignDialog(false);
                fetchTeachers();
            } catch (error) {
                console.error('Error assigning teacher:', error);
                setMessage('Failed to assign teacher');
                setShowPopup(true);
            }
        };

        const handleRemoveClass = async (teacherId) => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_BASE_URL}/TeacherRemoveClass`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            teacherId: teacherId,
                            classId: classID
                        })
                    }
                );
                const data = await response.json();
                if (data.message) {
                    setMessage(data.message);
                    setShowPopup(true);
                } else {
                    setMessage('Class removed successfully!');
                    setShowPopup(true);
                    fetchTeachers();
                }
            } catch (error) {
                console.error('Error removing class:', error);
                setMessage('Failed to remove class');
                setShowPopup(true);
            }
        };

        const isClassAssigned = (teacher) => {
            if (!teacher.teachSclass) return false;
            const classes = Array.isArray(teacher.teachSclass) 
                ? teacher.teachSclass 
                : [teacher.teachSclass];
            return classes.some(cls => cls._id === classID);
        };

        const teacherColumns = [
            { id: 'name', label: 'Teacher Name', minWidth: 170 },
            { id: 'subject', label: 'Subject', minWidth: 150 },
            { id: 'classes', label: 'Assigned Classes', minWidth: 150 },
        ];

        const teacherRows = teachers.map((teacher) => {
            const classes = Array.isArray(teacher.teachSclass) 
                ? teacher.teachSclass 
                : teacher.teachSclass ? [teacher.teachSclass] : [];
            
            return {
                name: teacher.name,
                subject: teacher.teachSubject?.subName || 'Not Assigned',
                classes: classes.map(cls => cls.sclassName).join(', ') || 'None',
                id: teacher._id,
                isAssigned: isClassAssigned(teacher),
                teacherData: teacher
            };
        });

        const TeachersButtonHaver = ({ row }) => {
            return (
                <>
                    {row.isAssigned ? (
                        <PurpleButton
                            variant="contained"
                            onClick={() => handleRemoveClass(row.id)}
                        >
                            Remove from Class
                        </PurpleButton>
                    ) : (
                        <GreenButton
                            variant="contained"
                            onClick={() => handleOpenAssignDialog(row)}
                        >
                            Assign to Class
                        </GreenButton>
                    )}
                    <BlueButton
                        variant="contained"
                        onClick={() => navigate("/Admin/teachers/teacher/" + row.id)}
                    >
                        View Details
                    </BlueButton>
                </>
            );
        };

        return (
            <>
                {loadingTeachers ? (
                    <div>Loading teachers...</div>
                ) : teachers.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
                        <Typography variant="h6">
                            No teachers found
                        </Typography>
                        <GreenButton
                            variant="contained"
                            onClick={() => navigate("/Admin/teachers")}
                        >
                            Go to Teachers Page
                        </GreenButton>
                    </Box>
                ) : (
                    <>
                        <Typography variant="h5" gutterBottom>
                            Teachers List:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Assign or remove teachers from this class
                        </Typography>
                        <TableTemplate 
                            buttonHaver={TeachersButtonHaver} 
                            columns={teacherColumns} 
                            rows={teacherRows} 
                        />
                    </>
                )}

                {/* Assign Teacher Dialog */}
                <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Assign Teacher to Class</DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            Teacher: <strong>{selectedTeacher?.name}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                            Class: <strong>{sclassDetails?.sclassName}</strong>
                        </Typography>
                        
                        <FormControl fullWidth>
                            <InputLabel>Select Subject</InputLabel>
                            <Select
                                value={selectedSubject}
                                label="Select Subject"
                                onChange={(e) => setSelectedSubject(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>No Subject (Assign Later)</em>
                                </MenuItem>
                                {subjectsList && subjectsList.length > 0 ? (
                                    subjectsList.map((subject) => (
                                        <MenuItem key={subject._id} value={subject._id}>
                                            {subject.subName} ({subject.subCode})
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>No subjects available</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            You can assign or change the subject for this teacher
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <BlueButton onClick={() => setOpenAssignDialog(false)}>
                            Cancel
                        </BlueButton>
                        <GreenButton onClick={handleAssignClass} variant="contained">
                            Assign Teacher
                        </GreenButton>
                    </DialogActions>
                </Dialog>
            </>
        );
    }

    const ClassDetailsSection = () => {
        const numberOfSubjects = subjectsList.length;
        const numberOfStudents = sclassStudents.length;

        return (
            <>
                <Typography variant="h4" align="center" gutterBottom>
                    Class Details
                </Typography>
                <Typography variant="h5" gutterBottom>
                    This is Class {sclassDetails && sclassDetails.sclassName}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Number of Subjects: {numberOfSubjects}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Number of Students: {numberOfStudents}
                </Typography>
                {getresponse &&
                    <GreenButton
                        variant="contained"
                        onClick={() => navigate("/Admin/class/addstudents/" + classID)}
                    >
                        Add Students
                    </GreenButton>
                }
                {response &&
                    <GreenButton
                        variant="contained"
                        onClick={() => navigate("/Admin/addsubject/" + classID)}
                    >
                        Add Subjects
                    </GreenButton>
                }
            </>
        );
    }

    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <Box sx={{ width: '100%', typography: 'body1', }} >
                        <TabContext value={value}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} sx={{ position: 'fixed', width: '100%', bgcolor: 'background.paper', zIndex: 1 }}>
                                    <Tab label="Details" value="1" />
                                    <Tab label="Subjects" value="2" />
                                    <Tab label="Students" value="3" />
                                    <Tab label="Teachers" value="4" />
                                </TabList>
                            </Box>
                            <Container sx={{ marginTop: "3rem", marginBottom: "4rem" }}>
                                <TabPanel value="1">
                                    <ClassDetailsSection />
                                </TabPanel>
                                <TabPanel value="2">
                                    <ClassSubjectsSection />
                                </TabPanel>
                                <TabPanel value="3">
                                    <ClassStudentsSection />
                                </TabPanel>
                                <TabPanel value="4">
                                    <ClassTeachersSection />
                                </TabPanel>
                            </Container>
                        </TabContext>
                    </Box>
                </>
            )}
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    );
};

export default ClassDetails;