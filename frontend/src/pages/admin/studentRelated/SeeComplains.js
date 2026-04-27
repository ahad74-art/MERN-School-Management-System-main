import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Paper, Box, Checkbox, Typography } from '@mui/material';
import { getAllComplains } from '../../../redux/complainRelated/complainHandle';
import TableTemplate from '../../../components/TableTemplate';

const SeeComplains = () => {

  const label = { inputProps: { 'aria-label': 'Checkbox demo' } };  const dispatch = useDispatch();
  const { complainsList, loading, error, response } = useSelector((state) => state.complain);
  const { currentUser } = useSelector(state => state.user)

  useEffect(() => {
    if (currentUser && currentUser._id) {
      dispatch(getAllComplains(currentUser._id, "Complain"));
    }
  }, [currentUser, dispatch]);

  if (error) {
    console.log(error);
  }

  const complainColumns = [
    { id: 'user', label: 'User', minWidth: 170 },
    { id: 'complaint', label: 'Complaint', minWidth: 100 },
    { id: 'date', label: 'Date', minWidth: 170 },
  ];

  const complainRows = complainsList && complainsList.length > 0 && complainsList.map((complain) => {
    const date = new Date(complain.date);
    const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
    return {
      user: complain.user.name,
      complaint: complain.complaint,
      date: dateString,
      id: complain._id,
    };
  });

  const ComplainButtonHaver = ({ row }) => {
    return (
      <>
        <Checkbox {...label} />
      </>
    );
  };

  return (
    <>
      {loading ?
        <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
        :
        <>
          {response ?
            <Box sx={{ p: 3 }}><Typography sx={{ color: '#64748B' }}>No Complains Right Now</Typography></Box>
            :
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1E293B', mb: 3 }}>Complaints</Typography>
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {Array.isArray(complainsList) && complainsList.length > 0 &&
                  <TableTemplate buttonHaver={ComplainButtonHaver} columns={complainColumns} rows={complainRows} />
                }
              </Paper>
            </Box>
          }
        </>
      }
    </>
  );
};

export default SeeComplains;