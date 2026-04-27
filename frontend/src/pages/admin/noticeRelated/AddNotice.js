import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addStuff } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import { Box, Paper, Typography, TextField, Button, CircularProgress, Stack } from '@mui/material';
import Popup from '../../../components/Popup';

const AddNotice = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, response, error } = useSelector(state => state.user);
  const { currentUser } = useSelector(state => state.user);

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const adminID = currentUser._id;

  const [loader, setLoader] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");

  const submitHandler = (event) => {
    event.preventDefault();
    setLoader(true);
    dispatch(addStuff({ title, details, date, adminID }, "Notice"));
  };

  useEffect(() => {
    if (status === 'added') {
      navigate('/Admin/notices');
      dispatch(underControl());
    } else if (status === 'error') {
      setMessage("Network Error");
      setShowPopup(true);
      setLoader(false);
    }
  }, [status, navigate, error, response, dispatch]);

  return (
    <>
      <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', width: '100%', maxWidth: 520, height: 'fit-content' }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1E293B', mb: 3 }}>Add Notice</Typography>
          <form onSubmit={submitHandler}>
            <Stack spacing={2.5}>
              <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              <TextField fullWidth label="Details" value={details} onChange={(e) => setDetails(e.target.value)} required multiline rows={3}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              <TextField fullWidth label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              <Button fullWidth type="submit" variant="contained" disabled={loader}
                sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.2, fontSize: 15 }}>
                {loader ? <CircularProgress size={22} color="inherit" /> : 'Add Notice'}
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

export default AddNotice;
