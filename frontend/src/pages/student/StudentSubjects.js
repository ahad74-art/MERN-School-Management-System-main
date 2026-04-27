import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getSubjectList } from '../../redux/sclassRelated/sclassHandle';
import { BottomNavigation, BottomNavigationAction, Paper, Table, TableBody, TableHead, Typography, Alert, Box } from '@mui/material';
import { getUserDetails } from '../../redux/userRelated/userHandle';
import CustomBarChart from '../../components/CustomBarChart'

import InsertChartIcon from '@mui/icons-material/InsertChart';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { StyledTableCell, StyledTableRow } from '../../components/styles';

const StudentSubjects = () => {

    const dispatch = useDispatch();
    const { subjectsList, sclassDetails } = useSelector((state) => state.sclass);
    const { userDetails, currentUser, loading, response, error } = useSelector((state) => state.user);

    useEffect(() => {
        if (currentUser && currentUser._id) {
            console.log('🔍 StudentSubjects: Fetching user details for student:', currentUser._id);
            dispatch(getUserDetails(currentUser._id, "Student"));
        }
    }, [dispatch, currentUser])

    // Debug logging
    useEffect(() => {
        if (response) { 
            console.log('📡 StudentSubjects API Response:', response);
        }
        if (error) { 
            console.log('❌ StudentSubjects API Error:', error);
        }
        if (userDetails) {
            console.log('👤 StudentSubjects User Details:', userDetails);
            console.log('📝 Exam Results:', userDetails.examResult);
            
            // Debug first exam result
            if (userDetails.examResult && userDetails.examResult.length > 0) {
                const firstResult = userDetails.examResult[0];
                console.log('🔍 First exam result:', firstResult);
                console.log('- subName type:', typeof firstResult.subName);
                console.log('- subName value:', firstResult.subName);
                if (firstResult.subName && typeof firstResult.subName === 'object') {
                    console.log('- subName.subName:', firstResult.subName.subName);
                }
            }
        }
    }, [userDetails, response, error]);

    const [subjectMarks, setSubjectMarks] = useState([]);
    const [selectedSection, setSelectedSection] = useState('table');

    useEffect(() => {
        if (userDetails) {
            console.log('🔄 Setting subject marks from userDetails');
            const examResults = userDetails.examResult || [];
            console.log('📊 Raw exam results:', examResults);
            setSubjectMarks(examResults);
        }
    }, [userDetails])

    useEffect(() => {
        if (subjectMarks.length === 0 && currentUser && currentUser.sclassName && currentUser.sclassName._id) {
            console.log('📚 No exam results found, fetching class subjects');
            dispatch(getSubjectList(currentUser.sclassName._id, "ClassSubjects"));
        }
    }, [subjectMarks, dispatch, currentUser]);

    const handleSectionChange = (event, newSection) => {
        setSelectedSection(newSection);
    };

    // Filter out invalid exam results
    const validSubjectMarks = subjectMarks.filter(result => {
        if (!result || !result.subName) {
            console.log('❌ Invalid exam result: missing subName', result);
            return false;
        }
        if (typeof result.subName === 'string') {
            console.log('❌ Invalid exam result: subName not populated', result);
            return false;
        }
        if (!result.subName.subName) {
            console.log('❌ Invalid exam result: subName.subName missing', result);
            return false;
        }
        if (result.marksObtained === undefined || result.marksObtained === null) {
            console.log('❌ Invalid exam result: marksObtained missing', result);
            return false;
        }
        return true;
    });

    console.log('✅ Valid subject marks:', validSubjectMarks);

    const renderTableSection = () => {
        return (
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B' }}>Subject Marks</Typography>
                    <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>Your exam results by subject</Typography>
                </Box>
                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                    <Table>
                        <TableHead>
                            <StyledTableRow>
                                <StyledTableCell>Subject</StyledTableCell>
                                <StyledTableCell>Marks Obtained</StyledTableCell>
                            </StyledTableRow>
                        </TableHead>
                        <TableBody>
                            {validSubjectMarks.map((result, index) => (
                                <StyledTableRow key={index}>
                                    <StyledTableCell>{result.subName.subName}</StyledTableCell>
                                    <StyledTableCell>
                                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: result.marksObtained >= 50 ? '#16A34A' : '#DC2626' }}>
                                            {result.marksObtained}
                                        </Typography>
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </Box>
        );
    };

    const renderChartSection = () => {
        try {
            // Transform data to match what CustomBarChart expects for marks
            const chartData = validSubjectMarks.map(result => ({
                subject: result.subName.subName,
                marksObtained: result.marksObtained,
                subName: result.subName // Keep the original subName object for tooltip
            }));
            
            console.log('📊 Chart data for marks:', chartData);
            
            if (chartData.length === 0) {
                return (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                        <Typography variant="h6">No data available for chart</Typography>
                    </Box>
                );
            }
            
            return <CustomBarChart chartData={chartData} dataKey="marksObtained" />;
        } catch (error) {
            console.error('❌ Error rendering chart:', error);
            return (
                <Alert severity="error" sx={{ m: 2 }}>
                    Error rendering chart: {error.message}
                </Alert>
            );
        }
    };

    const renderClassDetailsSection = () => {
        return (
            <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B' }}>My Subjects</Typography>
                    <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
                        Class {sclassDetails?.sclassName} — enrolled subjects
                    </Typography>
                </Box>
                {subjectsList && subjectsList.length > 0 ? (
                    subjectsList.map((subject, index) => (
                        <Paper key={index} elevation={0} sx={{ mb: 1.5, p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                            <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
                                {subject.subName} <Box component="span" sx={{ fontSize: 13, color: '#64748B', fontWeight: 400 }}>({subject.subCode})</Box>
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.5 }}>Sessions: {subject.sessions}</Typography>
                        </Paper>
                    ))
                ) : (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <Typography sx={{ color: '#94A3B8' }}>No subjects found for your class.</Typography>
                    </Paper>
                )}
            </Box>
        );
    };

    return (
        <>
            {loading ? (
                <Box sx={{ p: 3, background: '#F8FAFC', minHeight: '100vh' }}>
                    <Typography sx={{ color: '#64748B' }}>Loading subjects data...</Typography>
                </Box>
            ) : (
                <Box sx={{ background: '#F8FAFC', minHeight: '100vh', pb: 8 }}>
                    {error && <Alert severity="error" sx={{ m: 3, borderRadius: '8px' }}>{typeof error === 'string' ? error : JSON.stringify(error)}</Alert>}
                    {validSubjectMarks && validSubjectMarks.length > 0 ? (
                        <>
                            {selectedSection === 'table' && renderTableSection()}
                            {selectedSection === 'chart' && (
                                <Box sx={{ p: 3 }}>
                                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1E293B', mb: 3 }}>Marks Chart</Typography>
                                    {renderChartSection()}
                                </Box>
                            )}
                            <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid #E2E8F0' }}>
                                <BottomNavigation value={selectedSection} onChange={handleSectionChange} showLabels sx={{ background: '#fff' }}>
                                    <BottomNavigationAction label="Table" value="table" icon={selectedSection === 'table' ? <TableChartIcon /> : <TableChartOutlinedIcon />} />
                                    <BottomNavigationAction label="Chart" value="chart" icon={selectedSection === 'chart' ? <InsertChartIcon /> : <InsertChartOutlinedIcon />} />
                                </BottomNavigation>
                            </Paper>
                        </>
                    ) : (
                        <>
                            {subjectMarks.length > 0 && (
                                <Alert severity="warning" sx={{ m: 3, borderRadius: '8px' }}>Found {subjectMarks.length} exam records, but none are valid.</Alert>
                            )}
                            {renderClassDetailsSection()}
                        </>
                    )}
                </Box>
            )}
        </>
    );
};

export default StudentSubjects;