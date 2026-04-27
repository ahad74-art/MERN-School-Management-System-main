import { useEffect, useState } from 'react';
import { Box, CircularProgress, Stack, TextField, Typography, Button, MenuItem, FormControl, InputLabel, Select, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Popup from '../../components/Popup';
import { addStuff } from '../../redux/userRelated/userHandle';
import { useDispatch, useSelector } from 'react-redux';
import ListIcon from '@mui/icons-material/List';

const StudentComplain = () => {
    const [complaint, setComplaint] = useState("");
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("Other");
    const [priority, setPriority] = useState("Medium");
    const navigate = useNavigate();

    const dispatch = useDispatch()

    const { status, currentUser, error } = useSelector(state => state.user);

    const [loader, setLoader] = useState(false)
    const [message, setMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    // Move useEffect before any early returns
    useEffect(() => {
        if (status === "added") {
            setLoader(false)
            setShowPopup(true)
            setMessage("Complaint submitted successfully!")
            // Reset form
            setComplaint("")
            setDate("")
            setCategory("Other")
            setPriority("Medium")
        }
        else if (error) {
            setLoader(false)
            setShowPopup(true)
            setMessage("Network Error")
        }
    }, [status, error])

    // Add null checks for currentUser
    if (!currentUser) {
        return (
            <Box
                sx={{
                    flex: '1 1 auto',
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Typography variant="h6">Loading...</Typography>
            </Box>
        );
    }

    const user = currentUser._id
    const school = currentUser.school?._id
    const address = "Complain"

    const fields = {
        user,
        date,
        complaint,
        school,
        category,
        priority,
        status: 'Pending' // Default status
    };

    const submitHandler = (event) => {
        event.preventDefault()
        if (!school) {
            setMessage("School information not found. Please contact administrator.");
            setShowPopup(true);
            return;
        }
        setLoader(true)
        dispatch(addStuff(fields, address))
    };

    return (
        <>
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', width: '100%', maxWidth: 550, height: 'fit-content' }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 0.5 }}>Submit Complaint</Typography>
                    <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2 }}>
                        Please provide details about your complaint. We will review it and get back to you.
                    </Typography>
                    <Button variant="outlined" startIcon={<ListIcon />} onClick={() => navigate('/Student/complain/list')}
                        sx={{ mb: 3, borderRadius: '8px', textTransform: 'none', borderColor: '#1E3A8A', color: '#1E3A8A' }}>
                        View My Complaints
                    </Button>
                    <form onSubmit={submitHandler}>
                        <Stack spacing={2.5}>
                            <TextField fullWidth label="Select Date" type="date" value={date}
                                onChange={(e) => setDate(e.target.value)} required InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}
                                    sx={{ borderRadius: '8px' }}>
                                    {['Academic', 'Behavioral', 'Facility', 'Administrative', 'Other'].map(c => (
                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}
                                    sx={{ borderRadius: '8px' }}>
                                    {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                        <MenuItem key={p} value={p}>{p}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Write your complaint" multiline rows={4} value={complaint}
                                onChange={(e) => setComplaint(e.target.value)} required
                                placeholder="Please describe your complaint in detail..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <Button fullWidth type="submit" variant="contained" disabled={loader}
                                sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.2, fontSize: 15 }}>
                                {loader ? <CircularProgress size={22} color="inherit" /> : 'Submit Complaint'}
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Box>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    );
};

export default StudentComplain;