import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

const TestConnection = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);

    const addTest = (name, status, message, details = null) => {
        setTests(prev => [...prev, { name, status, message, details, timestamp: new Date() }]);
    };

    const runTests = async () => {
        setTests([]);
        setLoading(true);

        try {
            // Test 1: Check if backend is reachable
            addTest('Backend Server', 'testing', 'Checking if backend server is running...');
            
            try {
                const response = await fetch('http://localhost:5000/test', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    addTest('Backend Server', 'success', 'Backend server is running!', data);
                } else {
                    addTest('Backend Server', 'error', `Server responded with ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                addTest('Backend Server', 'error', 'Cannot connect to backend server', error.message);
            }

            // Test 2: Check guest accounts
            addTest('Guest Accounts', 'testing', 'Checking if guest accounts exist...');
            
            try {
                const response = await fetch('http://localhost:5000/CheckGuestAccounts');
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const accountsExist = data.accounts.admin && data.accounts.teacher && data.accounts.student;
                        if (accountsExist) {
                            addTest('Guest Accounts', 'success', 'All guest accounts exist!', data);
                        } else {
                            addTest('Guest Accounts', 'warning', 'Some guest accounts are missing', data);
                        }
                    } else {
                        addTest('Guest Accounts', 'error', 'Failed to check guest accounts', data);
                    }
                } else {
                    addTest('Guest Accounts', 'error', `Failed to check accounts: ${response.status}`);
                }
            } catch (error) {
                addTest('Guest Accounts', 'error', 'Error checking guest accounts', error.message);
            }

            // Test 3: Try to create guest accounts
            addTest('Create Accounts', 'testing', 'Attempting to create guest accounts...');
            
            try {
                const response = await fetch('http://localhost:5000/CreateGuestAccounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        addTest('Create Accounts', 'success', 'Guest accounts created successfully!', data);
                    } else {
                        addTest('Create Accounts', 'error', 'Failed to create guest accounts', data);
                    }
                } else {
                    addTest('Create Accounts', 'error', `Failed to create accounts: ${response.status}`);
                }
            } catch (error) {
                addTest('Create Accounts', 'error', 'Error creating guest accounts', error.message);
            }

            // Test 4: Test admin login
            addTest('Admin Login', 'testing', 'Testing admin login...');
            
            try {
                const response = await fetch('http://localhost:5000/AdminLogin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'ahad@gmail.com',
                        password: 'a12345'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.message) {
                        addTest('Admin Login', 'error', 'Login failed', data.message);
                    } else {
                        addTest('Admin Login', 'success', 'Admin login successful!', { name: data.name, email: data.email });
                    }
                } else {
                    addTest('Admin Login', 'error', `Login request failed: ${response.status}`);
                }
            } catch (error) {
                addTest('Admin Login', 'error', 'Error testing admin login', error.message);
            }

        } finally {
            setLoading(false);
        }
    };

    const getIcon = (status) => {
        switch (status) {
            case 'success': return <CheckIcon color="success" />;
            case 'error': return <ErrorIcon color="error" />;
            case 'warning': return <WarningIcon color="warning" />;
            case 'testing': return <CircularProgress size={20} />;
            default: return null;
        }
    };

    const getColor = (status) => {
        switch (status) {
            case 'success': return 'success';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                     Guest Login Diagnostic Tool
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 3 }}>
                    This tool will help diagnose why guest login isn't working. Click the button below to run all tests.
                </Typography>

                <Button 
                    variant="contained" 
                    onClick={runTests}
                    disabled={loading}
                    sx={{ mb: 3 }}
                >
                    {loading ? 'Running Tests...' : 'Run Diagnostic Tests'}
                </Button>

                {tests.length > 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Test Results:
                        </Typography>
                        
                        <List>
                            {tests.map((test, index) => (
                                <React.Fragment key={index}>
                                    <ListItem>
                                        <ListItemIcon>
                                            {getIcon(test.status)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={test.name}
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2">
                                                        {test.message}
                                                    </Typography>
                                                    {test.details && (
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                                            Details: {JSON.stringify(test.details, null, 2)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < tests.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                )}

                <Box sx={{ mt: 4 }}>
                    <Alert severity="info">
                        <Typography variant="subtitle2" gutterBottom>
                             Troubleshooting Tips:
                        </Typography>
                        <Typography variant="body2">
                            • Make sure your backend server is running (npm start in backend folder)<br/>
                            • Check that MongoDB is connected<br/>
                            • Verify no other service is using port 5000<br/>
                            • Check browser console for additional error messages<br/>
                            • Try refreshing the page after running tests
                        </Typography>
                    </Alert>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Alert severity="warning">
                        <Typography variant="subtitle2" gutterBottom>
                             Quick Fix:
                        </Typography>
                        <Typography variant="body2">
                            If tests pass but guest login still doesn't work, try:<br/>
                            1. Clear browser cache and cookies<br/>
                            2. Try in incognito/private browsing mode<br/>
                            3. Check Redux DevTools for login state changes<br/>
                            4. Restart both frontend and backend servers
                        </Typography>
                    </Alert>
                </Box>
            </Paper>
        </Box>
    );
};

export default TestConnection;