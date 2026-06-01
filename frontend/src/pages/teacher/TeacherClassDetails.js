import { useEffect, useState } from 'react';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Paper, Box, Typography, ButtonGroup, Button, Popper, Grow,
    ClickAwayListener, MenuList, MenuItem, Chip, Accordion,
    AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import TableTemplate from '../../components/TableTemplate';

const TeacherClassDetails = ({ selectedClass }) => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);
    const [groupedStudents, setGroupedStudents] = useState({});
    const [loadingStudents, setLoadingStudents] = useState(true);

    const subjectID = currentUser?.teachSubject?._id;
    const teacherClasses = Array.isArray(currentUser?.teachSclass)
        ? currentUser.teachSclass
        : currentUser?.teachSclass ? [currentUser.teachSclass] : [];

    useEffect(() => {
        const fetchAllStudents = async () => {
            if (teacherClasses.length === 0) { setLoadingStudents(false); return; }
            setLoadingStudents(true);
            const studentsData = {};
            try {
                for (const classObj of teacherClasses) {
                    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/Sclass/Students/${classObj._id}`);
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        studentsData[classObj.sclassName] = { classId: classObj._id, students: data };
                    }
                }
                setGroupedStudents(studentsData);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchAllStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const studentColumns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'rollNum', label: 'Roll Number', minWidth: 100 },
    ];

    const getStudentRows = (students) =>
        students.map((student) => ({ name: student.name, rollNum: student.rollNum, id: student._id }));

    const StudentsButtonHaver = ({ row }) => {
        const options = ['Take Attendance', 'Provide Marks'];
        const [open, setOpen] = React.useState(false);
        const anchorRef = React.useRef(null);
        const [selectedIndex, setSelectedIndex] = React.useState(0);

        const handleClick = () => {
            if (selectedIndex === 0) navigate(`/Teacher/class/student/attendance/${row.id}/${subjectID}`);
            else navigate(`/Teacher/class/student/marks/${row.id}/${subjectID}`);
        };

        const handleMenuItemClick = (event, index) => { setSelectedIndex(index); setOpen(false); };
        const handleToggle = () => setOpen((prev) => !prev);
        const handleClose = (event) => {
            if (anchorRef.current && anchorRef.current.contains(event.target)) return;
            setOpen(false);
        };

        return (
            <>
                <Button variant="outlined" size="small"
                    onClick={() => navigate('/Teacher/class/student/' + row.id)}
                    sx={{ mr: 1, borderRadius: '8px', textTransform: 'none', borderColor: '#1E3A8A', color: '#1E3A8A', fontSize: 12 }}>
                    View
                </Button>
                <React.Fragment>
                    <ButtonGroup variant="contained" ref={anchorRef} size="small"
                        sx={{ '& .MuiButton-root': { bgcolor: '#1E3A8A', textTransform: 'none', fontSize: 12 } }}>
                        <Button onClick={handleClick}>{options[selectedIndex]}</Button>
                        <Button size="small" onClick={handleToggle}
                            sx={{ px: 0.5, bgcolor: '#1E293B !important' }}>
                            {open ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                        </Button>
                    </ButtonGroup>
                    <Popper sx={{ zIndex: 1 }} open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
                        {({ TransitionProps, placement }) => (
                            <Grow {...TransitionProps} style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}>
                                <Paper elevation={3} sx={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <ClickAwayListener onClickAway={handleClose}>
                                        <MenuList id="split-button-menu" autoFocusItem>
                                            {options.map((option, index) => (
                                                <MenuItem key={option} selected={index === selectedIndex}
                                                    onClick={(event) => handleMenuItemClick(event, index)}
                                                    sx={{ fontSize: 13 }}>
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

    if (loadingStudents) return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Typography sx={{ color: '#64748B' }}>Loading students...</Typography>
        </Box>
    );

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#1E293B' }}>My Students</Typography>
                <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>Manage attendance and marks by class</Typography>
            </Box>

            {Object.keys(groupedStudents).length > 0 ? (
                Object.keys(groupedStudents).sort().map((className) => (
                    <Accordion key={className} defaultExpanded elevation={0}
                        sx={{ mb: 2, borderRadius: '12px !important', border: '1px solid #E2E8F0', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#64748B' }} />}
                            sx={{ borderRadius: '12px', background: '#fff', '&:hover': { background: '#F8FAFC' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                                <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>{className}</Typography>
                                <Chip label={`${groupedStudents[className].students.length} Students`} size="small"
                                    sx={{ fontSize: 11, bgcolor: '#EFF6FF', color: '#1E3A8A', fontWeight: 500 }} />
                                <Tooltip title={!subjectID ? 'No subject assigned' : ''}>
                                    <span>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            disabled={!subjectID}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/Teacher/class/bulk-attendance/${groupedStudents[className].classId}/${subjectID}`);
                                            }}
                                            sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', fontSize: 12, '&:hover': { bgcolor: '#1E293B' } }}
                                        >
                                            Take Class Attendance
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            <Paper elevation={0} sx={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                                {groupedStudents[className].students.length > 0 ? (
                                    <TableTemplate
                                        buttonHaver={StudentsButtonHaver}
                                        columns={studentColumns}
                                        rows={getStudentRows(groupedStudents[className].students)}
                                    />
                                ) : (
                                    <Box sx={{ p: 3 }}>
                                        <Typography sx={{ color: '#94A3B8', fontSize: 14 }}>No students in this class</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </AccordionDetails>
                    </Accordion>
                ))
            ) : (
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', textAlign: 'center' }}>
                    <Typography sx={{ color: '#94A3B8' }}>No classes assigned or no students found</Typography>
                </Paper>
            )}
        </Box>
    );
};

export default TeacherClassDetails;
