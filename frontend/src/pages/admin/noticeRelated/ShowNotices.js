import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import {
    Paper, Box, IconButton, Typography, Button
} from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from "@mui/icons-material/Delete";
import { getAllNotices } from '../../../redux/noticeRelated/noticeHandle';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import TableTemplate from '../../../components/TableTemplate';
import { GreenButton } from '../../../components/buttonStyles';
import SpeedDialTemplate from '../../../components/SpeedDialTemplate';

const ShowNotices = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { noticesList, loading, error, response } = useSelector((state) => state.notice);
    const { currentUser } = useSelector(state => state.user)

    useEffect(() => {
        if (currentUser && currentUser._id) {
            dispatch(getAllNotices(currentUser._id, "Notice"));
        }
    }, [currentUser, dispatch]);

    if (error) {
        console.log(error);
    }

    const deleteHandler = (deleteID, address) => {
        dispatch(deleteUser(deleteID, address))
            .then(() => {
                if (currentUser && currentUser._id) {
                    dispatch(getAllNotices(currentUser._id, "Notice"));
                }
            })
    }

    const noticeColumns = [
        { id: 'title', label: 'Title', minWidth: 170 },
        { id: 'details', label: 'Details', minWidth: 100 },
        { id: 'date', label: 'Date', minWidth: 170 },
    ];

    const noticeRows = noticesList && noticesList.length > 0 && noticesList.map((notice) => {
        const date = new Date(notice.date);
        const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
        return {
            title: notice.title,
            details: notice.details,
            date: dateString,
            id: notice._id,
        };
    });

    const NoticeButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Notice")}>
                    <DeleteIcon color="error" />
                </IconButton>
            </>
        );
    };

    const actions = [
        {
            icon: <NoteAddIcon color="primary" />, name: 'Add New Notice',
            action: () => navigate("/Admin/addnotice")
        },
        {
            icon: <DeleteIcon color="error" />, name: 'Delete All Notices',
            action: () => deleteHandler(currentUser._id, "Notices")
        }
    ];

    return (
        <>
            {loading ?
                <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
                :
                <>
                    {response ?
                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none' }} onClick={() => navigate("/Admin/addnotice")}>
                                Add Notice
                            </Button>
                        </Box>
                        :
                        <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 3 }}>Notices</Typography>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                {Array.isArray(noticesList) && noticesList.length > 0 &&
                                    <TableTemplate buttonHaver={NoticeButtonHaver} columns={noticeColumns} rows={noticeRows} />
                                }
                            </Paper>
                            <SpeedDialTemplate actions={actions} />
                        </Box>
                    }
                </>
            }
        </>
    );
};

export default ShowNotices;