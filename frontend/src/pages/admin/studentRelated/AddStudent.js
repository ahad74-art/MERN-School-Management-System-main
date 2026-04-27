import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../../redux/userRelated/userHandle';
import Popup from '../../../components/Popup';
import { underControl } from '../../../redux/userRelated/userSlice';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import { Box, Paper, Typography, TextField, Button, CircularProgress, Stack, MenuItem } from '@mui/material';

const AddStudent = ({ situation }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();

    const userState = useSelector(state => state.user);
    const { status, currentUser, response, error } = userState;
    const { sclassesList } = useSelector((state) => state.sclass);

    const [name, setName] = useState('');
    const [rollNum, setRollNum] = useState('');
    const [password, setPassword] = useState('');
    const [className, setClassName] = useState('');
    const [sclassName, setSclassName] = useState('');

    const adminID = currentUser._id;
    const role = "Student";
    const attendance = [];

    useEffect(() => {
        if (situation === "Class") setSclassName(params.id);
    }, [params.id, situation]);

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [loader, setLoader] = useState(false);

    useEffect(() => {
        dispatch(getAllSclasses(adminID, "Sclass"));
    }, [adminID, dispatch]);

    const changeHandler = (event) => {
        if (event.target.value === '') { setClassName(''); setSclassName(''); return; }
        const selectedClass = sclassesList.find(c => c.sclassName === event.target.value);
        setClassName(selectedClass.sclassName);
        setSclassName(selectedClass._id);
    };

    const submitHandler = (event) => {
        event.preventDefault();
        if (sclassName === "") { setMessage("Please select a classname"); setShowPopup(true); return; }
        setLoader(true);
        dispatch(registerUser({ name, rollNum, password, sclassName, adminID, role, attendance }, role));
    };

    useEffect(() => {
        if (status === 'added') { dispatch(underControl()); navigate(-1); }
        else if (status === 'failed') { setMessage(response); setShowPopup(true); setLoader(false); }
        else if (status === 'error') { setMessage("Network Error"); setShowPopup(true); setLoader(false); }
    }, [status, navigate, error, response, dispatch]);

    return (
        <>
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', width: '100%', maxWidth: 520, height: 'fit-content' }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1E293B', mb: 3 }}>Add Student</Typography>
                    <form onSubmit={submitHandler}>
                        <Stack spacing={2.5}>
                            <TextField fullWidth label="Student Name" value={name} onChange={(e) => setName(e.target.value)} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            {situation === "Student" && (
                                <TextField fullWidth select label="Class" value={className} onChange={changeHandler} required
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                                    <MenuItem value="">Select Class</MenuItem>
                                    {sclassesList.map((c, i) => (
                                        <MenuItem key={i} value={c.sclassName}>{c.sclassName}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                            <TextField fullWidth label="Roll Number" type="number" value={rollNum} onChange={(e) => setRollNum(e.target.value)} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <Button fullWidth type="submit" variant="contained" disabled={loader}
                                sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.2, fontSize: 15 }}>
                                {loader ? <CircularProgress size={22} color="inherit" /> : 'Add Student'}
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

export default AddStudent;
