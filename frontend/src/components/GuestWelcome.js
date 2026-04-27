import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    School as SchoolIcon,
    Chat as ChatIcon,
    VideoLibrary as VideoIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Analytics as AnalyticsIcon,
    Notifications as NotificationsIcon,
    AccountCircle as ProfileIcon,
    CheckCircle as CheckIcon,
    Star as StarIcon
} from '@mui/icons-material';

const GuestWelcome = ({ open, onClose, userRole }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const getFeaturesByRole = (role) => {
        const commonFeatures = [
            {
                icon: <ProfileIcon color="primary" />,
                title: 'Profile Management',
                description: 'View and edit personal information, update contact details'
            },
            {
                icon: <ChatIcon color="primary" />,
                title: 'Real-time Messaging',
                description: 'Chat with teachers/students, instant notifications'
            },
            {
                icon: <NotificationsIcon color="primary" />,
                title: 'Notice Board',
                description: 'Stay updated with school announcements and news'
            }
        ];

        const roleSpecificFeatures = {
            Admin: [
                {
                    icon: <PeopleIcon color="primary" />,
                    title: 'User Management',
                    description: 'Manage students, teachers, and classes'
                },
                {
                    icon: <SchoolIcon color="primary" />,
                    title: 'School Administration',
                    description: 'Oversee all school operations and data'
                },
                {
                    icon: <AnalyticsIcon color="primary" />,
                    title: 'Analytics & Reports',
                    description: 'View comprehensive school performance metrics'
                },
                {
                    icon: <AssignmentIcon color="primary" />,
                    title: 'Complaint Management',
                    description: 'Handle and resolve student/teacher complaints'
                }
            ],
            Teacher: [
                {
                    icon: <VideoIcon color="primary" />,
                    title: 'Lecture Management',
                    description: 'Upload videos, PDFs, create text lectures'
                },
                {
                    icon: <AssignmentIcon color="primary" />,
                    title: 'Student Assessment',
                    description: 'Mark attendance, assign grades, track progress'
                },
                {
                    icon: <PeopleIcon color="primary" />,
                    title: 'Class Management',
                    description: 'View student details, manage class activities'
                },
                {
                    icon: <AnalyticsIcon color="primary" />,
                    title: 'Teaching Analytics',
                    description: 'Track lecture views, student engagement'
                }
            ],
            Student: [
                {
                    icon: <VideoIcon color="primary" />,
                    title: 'Lecture Viewing',
                    description: 'Access video lectures, PDFs, track progress'
                },
                {
                    icon: <AssignmentIcon color="primary" />,
                    title: 'Academic Progress',
                    description: 'View grades, attendance, subject performance'
                },
                {
                    icon: <SchoolIcon color="primary" />,
                    title: 'Subject Dashboard',
                    description: 'Interactive charts showing academic performance'
                },
                {
                    icon: <NotificationsIcon color="primary" />,
                    title: 'Complaint System',
                    description: 'Submit and track complaints or suggestions'
                }
            ]
        };

        return [...commonFeatures, ...roleSpecificFeatures[role]];
    };

    const features = getFeaturesByRole(userRole);

    const quickStartGuide = {
        Admin: [
            'Navigate to "Students" to see student management features',
            'Check "Teachers" section for teacher administration',
            'Visit "Notices" to see announcement system',
            'Explore "Complains" for complaint management'
        ],
        Teacher: [
            'Go to "Lectures" to create and manage your content',
            'Visit "Class" to see your assigned students',
            'Use "Messages" to chat with students',
            'Check "Complain" section for student feedback'
        ],
        Student: [
            'Visit "Lectures" to access learning materials',
            'Check "Subjects" for your academic performance',
            'View "Attendance" to track your presence',
            'Use "Messages" to communicate with teachers'
        ]
    };

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <StarIcon sx={{ fontSize: 60, color: '#7f56da', mb: 2 }} />
                            <Typography variant="h4" gutterBottom>
                                Welcome to Demo Mode!
                            </Typography>
                            <Typography variant="h6" color="textSecondary">
                                You're logged in as: <Chip label={userRole} color="primary" />
                            </Typography>
                        </Box>
                        
                        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                            Explore our comprehensive school management system with full access to all features.
                            This demo contains sample data to showcase the complete functionality.
                        </Typography>
                        
                        <Box sx={{ 
                            backgroundColor: '#f8f9fa', 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid #e9ecef' 
                        }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                🎯 Demo Credentials:
                            </Typography>
                            <Typography variant="body2">
                                <strong>Admin:</strong> yogendra@12 / zxc<br/>
                                <strong>Teacher:</strong> tony@12 / zxc<br/>
                                <strong>Student:</strong> Roll: 1, Name: Dipesh Awasthi, Password: zxc
                            </Typography>
                        </Box>
                    </Box>
                );
            
            case 1:
                return (
                    <Box>
                        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                            🚀 Features Available for {userRole}
                        </Typography>
                        
                        <Grid container spacing={2}>
                            {features.map((feature, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <Card sx={{ height: '100%', border: '1px solid #e0e0e0' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                {feature.icon}
                                                <Typography variant="h6" sx={{ ml: 1 }}>
                                                    {feature.title}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="textSecondary">
                                                {feature.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            
            case 2:
                return (
                    <Box>
                        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                            🎯 Quick Start Guide
                        </Typography>
                        
                        <Typography variant="h6" gutterBottom>
                            Recommended first steps:
                        </Typography>
                        
                        <List>
                            {quickStartGuide[userRole].map((step, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        <CheckIcon color="success" />
                                    </ListItemIcon>
                                    <ListItemText primary={step} />
                                </ListItem>
                            ))}
                        </List>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ 
                            backgroundColor: '#e8f5e8', 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid #c8e6c9' 
                        }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                💡 Pro Tips:
                            </Typography>
                            <Typography variant="body2">
                                • All data is sample data - feel free to experiment!<br/>
                                • Try switching between different user roles to see all perspectives<br/>
                                • The chat system works in real-time between different user types<br/>
                                • Lecture progress and comments are fully functional
                            </Typography>
                        </Box>
                    </Box>
                );
            
            default:
                return null;
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleSkip}
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { minHeight: '500px' }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    {[0, 1, 2].map((step) => (
                        <Box
                            key={step}
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: currentStep >= step ? '#7f56da' : '#e0e0e0',
                                mx: 0.5
                            }}
                        />
                    ))}
                </Box>
                Step {currentStep + 1} of 3
            </DialogTitle>
            
            <DialogContent sx={{ minHeight: '400px' }}>
                {renderStep()}
            </DialogContent>
            
            <DialogActions sx={{ justifyContent: 'space-between', p: 3 }}>
                <Button onClick={handleSkip} color="inherit">
                    Skip Tour
                </Button>
                <Button 
                    onClick={handleNext} 
                    variant="contained"
                    sx={{ backgroundColor: '#7f56da' }}
                >
                    {currentStep < 2 ? 'Next' : 'Start Exploring!'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GuestWelcome;