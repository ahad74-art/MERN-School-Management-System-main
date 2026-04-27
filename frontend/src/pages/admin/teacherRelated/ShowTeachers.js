import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'
import { getAllTeachers } from '../../../redux/teacherRelated/teacherHandle';
import {
    Paper, Table, TableBody, TableContainer,
    TableHead, TablePagination, Button, Box, IconButton, Typography,
} from '@mui/material';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { StyledTableCell, StyledTableRow } from '../../../components/styles';
import { BlueButton, GreenButton } from '../../../components/buttonStyles';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';
import Popup from '../../../components/Popup';

const ShowTeachers = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { teachersList, loading, error, response } = useSelector((state) => state.teacher);
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        if (currentUser && currentUser._id) {
            dispatch(getAllTeachers(currentUser._id));
        }
    }, [currentUser, dispatch]);

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
    } else if (response) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }} onClick={() => navigate("/Admin/teachers/chooseclass")}>
                    Add Teacher
                </Button>
            </Box>
        );
    } else if (error) {
        console.log(error);
    }

    const deleteHandler = (deleteID, address) => {
            console.log(deleteID);
            console.log(address);
    
            dispatch(deleteUser(deleteID, address))
                .then(() => {
                    if (currentUser && currentUser._id) {
                        dispatch(getAllTeachers(currentUser._id));
                    }
                    setMessage("Teacher deleted successfully")
                    setShowPopup(true)
                })
                .catch((error) => {
                    setMessage("Failed to delete teacher")
                    setShowPopup(true)
                })
    };

    const columns = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'email', label: 'Email', minWidth: 200 },
        { id: 'phone', label: 'Phone', minWidth: 150 },
        { id: 'teachSubject', label: 'Subject', minWidth: 100 },
        { id: 'teachSclass', label: 'Class', minWidth: 170 },
        { id: 'password', label: 'Password', minWidth: 120 },
    ];

    const rows = teachersList.map((teacher) => {
        // Handle multiple classes
        const classNames = Array.isArray(teacher.teachSclass) 
            ? teacher.teachSclass.map(cls => cls.sclassName).join(', ')
            : teacher.teachSclass?.sclassName || 'Not assigned';
        
        const classIds = Array.isArray(teacher.teachSclass)
            ? teacher.teachSclass.map(cls => cls._id)
            : teacher.teachSclass?._id ? [teacher.teachSclass._id] : [];

        return {
            name: teacher.name,
            email: teacher.email || 'Not provided',
            phone: teacher.phone || 'Not provided',
            teachSubject: teacher.teachSubject?.subName || null,
            teachSclass: classNames,
            password: '••••••••',
            teachSclassID: classIds[0] || null, // For backward compatibility
            teachSclassIDs: classIds,
            id: teacher._id,
        };
    });

    const actions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: 'Add New Teacher',
            action: () => navigate("/Admin/teachers/chooseclass")
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: 'Delete All Teachers',
            action: () => deleteHandler(currentUser._id, "Teachers")
        },
    ];

    return (
        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 3 }}>Teachers</Typography>
            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <StyledTableRow>
                                {columns.map((column) => (
                                    <StyledTableCell key={column.id} align={column.align} style={{ minWidth: column.minWidth }}>
                                        {column.label}
                                    </StyledTableCell>
                                ))}
                                <StyledTableCell align="center">Actions</StyledTableCell>
                            </StyledTableRow>
                        </TableHead>
                        <TableBody>
                            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                                <StyledTableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                    {columns.map((column) => {
                                        const value = row[column.id];
                                        if (column.id === 'teachSubject') {
                                            return (
                                                <StyledTableCell key={column.id} align={column.align}>
                                                    {value ? value : (
                                                        <Button variant="contained" size="small"
                                                            sx={{ bgcolor: '#1E3A8A', borderRadius: '6px', textTransform: 'none' }}
                                                            onClick={() => navigate(`/Admin/teachers/choosesubject/${row.teachSclassID}/${row.id}`)}>
                                                            Add Subject
                                                        </Button>
                                                    )}
                                                </StyledTableCell>
                                            );
                                        }
                                        return (
                                            <StyledTableCell key={column.id} align={column.align}>
                                                {column.format && typeof value === 'number' ? column.format(value) : value}
                                            </StyledTableCell>
                                        );
                                    })}
                                    <StyledTableCell align="center">
                                        <IconButton onClick={() => deleteHandler(row.id, "Teacher")}>
                                            <PersonRemoveIcon color="error" />
                                        </IconButton>
                                        <BlueButton variant="contained" onClick={() => navigate("/Admin/teachers/teacher/" + row.id)}>
                                            View
                                        </BlueButton>
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 100]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 5)); setPage(0); }}
                    sx={{ borderTop: '1px solid #E2E8F0' }}
                />
            </Paper>
            <SpeedDialTemplate actions={actions} />
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </Box>
    );
};

export default ShowTeachers