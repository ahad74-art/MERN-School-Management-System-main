import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { getAllStudents } from '../../../redux/studentRelated/studentHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import {
    Paper, Box, IconButton, Typography, Accordion, AccordionSummary, AccordionDetails,
    Chip, Button, ButtonGroup, MenuItem, MenuList
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { BlackButton, BlueButton } from '../../../components/buttonStyles';
import TableTemplate from '../../../components/TableTemplate';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';
import * as React from 'react';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Popper from '@mui/material/Popper';
import Popup from '../../../components/Popup';

const ShowStudents = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { studentsList, loading, error, response } = useSelector((state) => state.student);
    const { currentUser } = useSelector(state => state.user)
    const [groupedStudents, setGroupedStudents] = useState({});

    useEffect(() => {
        if (currentUser && currentUser._id) {
            dispatch(getAllStudents(currentUser._id));
        }
    }, [currentUser, dispatch]);

    useEffect(() => {
        if (studentsList && studentsList.length > 0) {
            // Group students by class
            const grouped = studentsList.reduce((acc, student) => {
                const className = student.sclassName?.sclassName || 'Unassigned';
                if (!acc[className]) {
                    acc[className] = [];
                }
                acc[className].push(student);
                return acc;
            }, {});
            setGroupedStudents(grouped);
        }
    }, [studentsList]);

    if (error) {
        console.log(error);
    }

    const [showPopup, setShowPopup] = React.useState(false);
    const [message, setMessage] = React.useState("");

    const deleteHandler = (deleteID, address) => {
        console.log(deleteID);
        console.log(address);

        dispatch(deleteUser(deleteID, address))
            .then(() => {
                if (currentUser && currentUser._id) {
                    dispatch(getAllStudents(currentUser._id));
                }
                setMessage("Student deleted successfully")
                setShowPopup(true)
            })
            .catch((error) => {
                setMessage("Failed to delete student")
                setShowPopup(true)
            })
    }

    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
        { id: 'email', label: 'Email', minWidth: 200 },
        { id: 'phone', label: 'Phone', minWidth: 150 },
        { id: 'password', label: 'Password', minWidth: 120 },
    ]

    const getStudentRows = (students) => {
        return students.map((student) => {
            return {
                name: student.name,
                rollNum: student.rollNum,
                email: student.email || 'Not provided',
                phone: student.phone || 'Not provided',
                password: '••••••••',
                id: student._id,
            };
        });
    };

    const StudentButtonHaver = ({ row }) => {
        const options = ['Take Attendance', 'Provide Marks'];

        const [open, setOpen] = React.useState(false);
        const anchorRef = React.useRef(null);
        const [selectedIndex, setSelectedIndex] = React.useState(0);

        const handleClick = () => {
            console.info(`You clicked ${options[selectedIndex]}`);
            if (selectedIndex === 0) {
                handleAttendance();
            } else if (selectedIndex === 1) {
                handleMarks();
            }
        };

        const handleAttendance = () => {
            navigate("/Admin/students/student/attendance/" + row.id)
        }
        const handleMarks = () => {
            navigate("/Admin/students/student/marks/" + row.id)
        };

        const handleMenuItemClick = (event, index) => {
            setSelectedIndex(index);
            setOpen(false);
        };

        const handleToggle = () => {
            setOpen((prevOpen) => !prevOpen);
        };

        const handleClose = (event) => {
            if (anchorRef.current && anchorRef.current.contains(event.target)) {
                return;
            }

            setOpen(false);
        };
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Student")}>
                    <PersonRemoveIcon color="error" />
                </IconButton>
                <BlueButton variant="contained"
                    onClick={() => navigate("/Admin/students/student/" + row.id)}>
                    View
                </BlueButton>
                <React.Fragment>
                    <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
                        <Button onClick={handleClick}>{options[selectedIndex]}</Button>
                        <BlackButton
                            size="small"
                            aria-controls={open ? 'split-button-menu' : undefined}
                            aria-expanded={open ? 'true' : undefined}
                            aria-label="select merge strategy"
                            aria-haspopup="menu"
                            onClick={handleToggle}
                        >
                            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </BlackButton>
                    </ButtonGroup>
                    <Popper
                        sx={{
                            zIndex: 1,
                        }}
                        open={open}
                        anchorEl={anchorRef.current}
                        role={undefined}
                        transition
                        disablePortal
                    >
                        {({ TransitionProps, placement }) => (
                            <Grow
                                {...TransitionProps}
                                style={{
                                    transformOrigin:
                                        placement === 'bottom' ? 'center top' : 'center bottom',
                                }}
                            >
                                <Paper>
                                    <ClickAwayListener onClickAway={handleClose}>
                                        <MenuList id="split-button-menu" autoFocusItem>
                                            {options.map((option, index) => (
                                                <MenuItem
                                                    key={option}
                                                    disabled={index === 2}
                                                    selected={index === selectedIndex}
                                                    onClick={(event) => handleMenuItemClick(event, index)}
                                                >
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </MenuList>
                                    </ClickAwayListener>
                                </Paper>
                            </Grow>
                        )}
                    </Popper>
                </React.Fragment>
            </>
        );
    };

    const actions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: 'Add New Student',
            action: () => navigate("/Admin/addstudents")
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: 'Delete All Students',
            action: () => deleteHandler(currentUser._id, "Students")
        },
    ];

    return (
        <>
            {loading ?
                <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
                :
                <>
                    {response ?
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }} onClick={() => navigate("/Admin/addstudents")}>
                                Add Students
                            </Button>
                        </Box>
                        :
                        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 3 }}>Students</Typography>
                            {Object.keys(groupedStudents).length > 0 ? (
                                Object.keys(groupedStudents).sort().map((className) => (
                                    <Accordion key={className} defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', '&:before': { display: 'none' } }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: '12px', background: '#F8FAFC' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontWeight: 600, color: '#1E293B' }}>{className}</Typography>
                                                <Chip label={`${groupedStudents[className].length} Students`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#1E3A8A', fontWeight: 600 }} />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0 }}>
                                            <Paper elevation={0} sx={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                                                <TableTemplate buttonHaver={StudentButtonHaver} columns={studentColumns} rows={getStudentRows(groupedStudents[className])} />
                                            </Paper>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            ) : (
                                <Typography sx={{ color: '#64748B' }}>No students found</Typography>
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

export default ShowStudents;