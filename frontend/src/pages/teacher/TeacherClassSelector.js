import React, { useState } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { useSelector } from 'react-redux';

const TeacherClassSelector = ({ onClassChange }) => {
    const { currentUser } = useSelector((state) => state.user);
    const [selectedClass, setSelectedClass] = useState(
        currentUser?.teachSclass?.[0]?._id || ''
    );

    const handleClassChange = (event) => {
        const classId = event.target.value;
        setSelectedClass(classId);
        
        // Find the full class object
        const selectedClassObj = currentUser?.teachSclass?.find(
            cls => cls._id === classId
        );
        
        if (onClassChange) {
            onClassChange(selectedClassObj);
        }
    };

    // If teacher has no classes or only one class, don't show selector
    if (!currentUser?.teachSclass || currentUser.teachSclass.length <= 1) {
        return null;
    }

    return (
        <Box sx={{ minWidth: 200, mr: 2 }}>
            <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'white' }}>Select Class</InputLabel>
                <Select
                    value={selectedClass}
                    label="Select Class"
                    onChange={handleClassChange}
                    sx={{
                        color: 'white',
                        '.MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                        },
                        '.MuiSvgIcon-root': {
                            color: 'white',
                        }
                    }}
                >
                    {currentUser.teachSclass.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                            {cls.sclassName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default TeacherClassSelector;
