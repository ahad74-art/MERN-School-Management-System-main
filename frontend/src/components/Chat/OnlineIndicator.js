import React from 'react';
import { Box } from '@mui/material';

/**
 * OnlineIndicator Component
 * Displays a colored dot to indicate online/offline status
 * 
 * @param {boolean} isOnline - Whether the user is online
 * @param {string} size - Size of the indicator ('small', 'medium', 'large')
 * @param {boolean} showBorder - Whether to show white border around indicator
 */
const OnlineIndicator = ({ isOnline, size = 'small', showBorder = true }) => {
    // Size mapping
    const sizeMap = {
        small: 8,
        medium: 12,
        large: 16
    };

    const dotSize = sizeMap[size] || sizeMap.small;

    return (
        <Box
            sx={{
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#4caf50' : '#9e9e9e', // Green for online, Grey for offline
                border: showBorder ? '2px solid white' : 'none',
                boxShadow: isOnline ? '0 0 4px rgba(76, 175, 80, 0.5)' : 'none', // Glow effect for online
                transition: 'all 0.3s ease',
                flexShrink: 0
            }}
            title={isOnline ? 'Online' : 'Offline'}
        />
    );
};

export default OnlineIndicator;
