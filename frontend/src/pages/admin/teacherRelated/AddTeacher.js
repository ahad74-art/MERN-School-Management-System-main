import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubjectDetails } from '../../../redux/sclassRelated/sclassHandle';
import Popup from '../../../components/Popup';
import { registerUser } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import { Box, Paper, Typography, TextField, Button, CircularProgress, Stack } from '@mui/material';

const AddTeacher = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const subjectID = params.id;

  const { status, response, error } = useSelector(state => state.user);
  const { subjectDetails } = useSelector((state) => state.sclass);

  useEffect(() => {
    dispatch(getSubjectDetails(subjectID, "Subject"));
  }, [dispatch, subjectID]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [loader, setLoader] = useState(false);

  const role = "Teacher";
  const school = subjectDetails?.school;
  const teachSubject = subjectDetails?._id;
  const teachSclass = subjectDetails?.sclassName?._id;

  const submitHandler = (event) => {
    event.preventDefault();
    setLoader(true);
    dispatch(registerUser({ name, email, password, role, school, teachSubject, teachSclass }, role));
  };

  useEffect(() => {
    if (status === 'added') { dispatch(underControl()); navigate("/Admin/teachers"); }
    else if (status === 'failed') { setMessage(response); setShowPopup(true); setLoader(false); }
    else if (status === 'error') { setMessage("Network Error"); setShowPopup(true); setLoader(false); }
  }, [status, navigate, error, response, dispatch]);

  return (
    <>
      <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', width: '100%', maxWidth: 520, height: 'fit-content' }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1E293B', mb: 0.5 }}>Add Teacher</Typography>
          <Typography sx={{ fontSize: 13, color: '#64748B', mb: 3 }}>
            Subject: {subjectDetails?.subName} &nbsp;|&nbsp; Class: {subjectDetails?.sclassName?.sclassName}
          </Typography>
          <form onSubmit={submitHandler}>
            <Stack spacing={2.5}>
              <TextField fullWidth label="Teacher Name" value={name} onChange={(e) => setName(e.target.value)} required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              <Button fullWidth type="submit" variant="contained" disabled={loader}
                sx={{ bgcolor: '#1E3A8A', borderRadius: '8px', textTransform: 'none', py: 1.2, fontSize: 15 }}>
                {loader ? <CircularProgress size={22} color="inherit" /> : 'Register Teacher'}
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

export default AddTeacher;
