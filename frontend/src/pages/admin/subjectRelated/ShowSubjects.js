import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { getSubjectList } from '../../../redux/sclassRelated/sclassHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import PostAddIcon from '@mui/icons-material/PostAdd';
import {
    Paper, Box, IconButton, Typography, Accordion, AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from "@mui/icons-material/Delete";
import TableTemplate from '../../../components/TableTemplate';
import { BlueButton, GreenButton } from '../../../components/buttonStyles';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';
import Popup from '../../../components/Popup';

const ShowSubjects = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { subjectsList, loading, error, response } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector(state => state.user)
    const [groupedSubjects, setGroupedSubjects] = useState({});

    useEffect(() => {
        if (currentUser && currentUser._id) {
            dispatch(getSubjectList(currentUser._id, "AllSubjects"));
        }
    }, [currentUser, dispatch]);

    useEffect(() => {
        if (subjectsList && subjectsList.length > 0) {
            // Group subjects by class
            const grouped = subjectsList.reduce((acc, subject) => {
                const className = subject.sclassName?.sclassName || 'Unassigned';
                if (!acc[className]) {
                    acc[className] = {
                        classId: subject.sclassName?._id,
                        subjects: []
                    };
                }
                acc[className].subjects.push(subject);
                return acc;
            }, {});
            setGroupedSubjects(grouped);
        }
    }, [subjectsList]);

    if (error) {
        console.log(error);
    }

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const deleteHandler = (deleteID, address) => {
                console.log(deleteID);
                console.log(address);
        
                dispatch(deleteUser(deleteID, address))
                    .then(() => {
                        if (currentUser && currentUser._id) {
                            dispatch(getSubjectList(currentUser._id));
                        }
                        setMessage("Subject deleted successfully")
                        setShowPopup(true)
                    })
                    .catch((error) => {
                        setMessage("Failed to delete subject")
                        setShowPopup(true)
                    })
    }

    const subjectColumns = [
        { id: 'subName', label: 'Sub Name', minWidth: 170 },
        { id: 'sessions', label: 'Sessions', minWidth: 100 },
        { id: 'teacher', label: 'Teacher', minWidth: 150 },
    ]

    const getSubjectRows = (subjects) => {
        return subjects.map((subject) => {
            return {
                subName: subject.subName,
                sessions: subject.sessions,
                teacher: subject.teacher?.name || 'Not Assigned',
                sclassID: subject.sclassName._id,
                id: subject._id,
            };
        });
    };

    const SubjectsButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Subject")}>
                    <DeleteIcon color="error" />
                </IconButton>
                <BlueButton variant="contained"
                    onClick={() => navigate(`/Admin/subjects/subject/${row.sclassID}/${row.id}`)}>
                    View
                </BlueButton>
            </>
        );
    };

    const actions = [
        {
            icon: <PostAddIcon color="primary" />, name: 'Add New Subject',
            action: () => navigate("/Admin/subjects/chooseclass")
        },
        {
            icon: <DeleteIcon color="error" />, name: 'Delete All Subjects',
            action: () => deleteHandler(currentUser._id, "Subjects")
        }
    ];

    return (
        <>
            {loading ?
                <div>Loading...</div>
                :
                <>
                    {response ?
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <GreenButton variant="contained"
                                onClick={() => navigate("/Admin/subjects/chooseclass")}>
                                Add Subjects
                            </GreenButton>
                        </Box>
                        :
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                                Subjects by Class
                            </Typography>
                            {Object.keys(groupedSubjects).length > 0 ? (
                                Object.keys(groupedSubjects).sort().map((className) => (
                                    <Accordion key={className} defaultExpanded>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            sx={{ 
                                                backgroundColor: '#f5f5f5',
                                                '&:hover': { backgroundColor: '#e0e0e0' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                <Typography variant="h6">
                                                    {className}
                                                </Typography>
                                                <Chip 
                                                    label={`${groupedSubjects[className].subjects.length} Subjects`} 
                                                    color="primary" 
                                                    size="small"
                                                />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                                                <TableTemplate 
                                                    buttonHaver={SubjectsButtonHaver} 
                                                    columns={subjectColumns} 
                                                    rows={getSubjectRows(groupedSubjects[className].subjects)} 
                                                />
                                            </Paper>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            ) : (
                                <Typography>No subjects found</Typography>
                            )}
                            <SpeedDialTemplate actions={actions} />
                        </Box>
                    }
                </>
            }
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />

        </>
    );
};

export default ShowSubjects;