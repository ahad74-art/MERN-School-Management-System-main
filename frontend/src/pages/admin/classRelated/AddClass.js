import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, TextField, Paper, Typography } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addStuff } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import Popup from "../../../components/Popup";
import Classroom from "../../../assets/classroom.png";

const AddClass = () => {
    const [sclassName, setSclassName] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userState = useSelector(state => state.user);
    const { status, currentUser, response, error, tempDetails } = userState;
    const adminID = currentUser._id;
    const [loader, setLoader] = useState(false);
    const [message, setMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    const submitHandler = (event) => {
        event.preventDefault();
        setLoader(true);
        dispatch(addStuff({ sclassName, adminID }, "Sclass"));
    };

    useEffect(() => {
        if (status === 'added' && tempDetails) {
            navigate("/Admin/classes/class/" + tempDetails._id + "?tab=4");
            dispatch(underControl());
            setLoader(false);
        } else if (status === 'failed') {
            setMessage(response); setShowPopup(true); setLoader(false);
        } else if (status === 'error') {
            setMessage("Network Error"); setShowPopup(true); setLoader(false);
        }
    }, [status, navigate, error, response, dispatch, tempDetails]);

    return (
        <>
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', width: '100%', maxWidth: 520, height: 'fit-content' }}>
                    <Stack sx={{ alignItems: 'center', mb: 3 }}>
                        <img src={Classroom} alt="classroom" style={{ width: '70%' }} />
                    </Stack>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1E293B', mb: 3 }}>Create a Class</Typography>
                    <form onSubmit={submitHandler}>
                        <Stack spacing={2.5}>
                            <TextField fullWidth label="Class Name" variant="outlined" value={sclassName}
                                onChange={(e) => setSclassName(e.target.value)} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <Button fullWidth type="submit" variant="contained" disabled={loader}
                                sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.2, fontSize: 15 }}>
                                {loader ? <CircularProgress size={22} color="inherit" /> : "Create"}
                            </Button>
                            <Button fullWidth variant="outlined" onClick={() => navigate(-1)}
                                sx={{ borderRadius: '8px', textTransform: 'none' }}>
                                Go Back
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Box>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    );
};

export default AddClass;
