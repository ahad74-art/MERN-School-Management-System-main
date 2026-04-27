// Test data structure for CustomBarChart component

// Test data for attendance chart
export const testAttendanceData = [
    {
        subject: "Physics",
        attendancePercentage: 85.5,
        totalClasses: 30,
        attendedClasses: 25
    },
    {
        subject: "Chemistry",
        attendancePercentage: 92.3,
        totalClasses: 30,
        attendedClasses: 28
    },
    {
        subject: "Biology",
        attendancePercentage: 78.9,
        totalClasses: 30,
        attendedClasses: 23
    }
];

// Test data for marks chart
export const testMarksData = [
    {
        subject: "Physics",
        marksObtained: 85,
        subName: {
            subName: "Physics",
            subCode: "PHY01",
            _id: "test-id-1"
        }
    },
    {
        subject: "Chemistry",
        marksObtained: 92,
        subName: {
            subName: "Chemistry",
            subCode: "CHE01",
            _id: "test-id-2"
        }
    },
    {
        subject: "Biology",
        marksObtained: 78,
        subName: {
            subName: "Biology",
            subCode: "BIO01",
            _id: "test-id-3"
        }
    }
];

// Function to validate chart data structure
export const validateChartData = (data, dataKey) => {
    console.log('🧪 Validating chart data:', data);
    console.log('🧪 Data key:', dataKey);
    
    if (!Array.isArray(data)) {
        console.error('❌ Chart data is not an array');
        return false;
    }
    
    if (data.length === 0) {
        console.warn('⚠️ Chart data is empty');
        return true; // Empty data is valid, just no chart to show
    }
    
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        // Check required fields
        if (!item.subject) {
            console.error(`❌ Item ${i}: missing 'subject' field`);
            return false;
        }
        
        if (item[dataKey] === undefined || item[dataKey] === null) {
            console.error(`❌ Item ${i}: missing '${dataKey}' field`);
            return false;
        }
        
        // Specific validation for marks data
        if (dataKey === 'marksObtained') {
            if (!item.subName || typeof item.subName !== 'object') {
                console.error(`❌ Item ${i}: missing or invalid 'subName' object`);
                return false;
            }
            if (!item.subName.subName) {
                console.error(`❌ Item ${i}: missing 'subName.subName' field`);
                return false;
            }
        }
        
        // Specific validation for attendance data
        if (dataKey === 'attendancePercentage') {
            if (typeof item.attendancePercentage !== 'number') {
                console.error(`❌ Item ${i}: 'attendancePercentage' is not a number`);
                return false;
            }
            if (!item.totalClasses || !item.attendedClasses) {
                console.error(`❌ Item ${i}: missing attendance details`);
                return false;
            }
        }
    }
    
    console.log('✅ Chart data validation passed');
    return true;
};

// Test function to run validation
export const runChartDataTests = () => {
    console.log('🧪 Running chart data tests...');
    
    console.log('\n📊 Testing attendance data:');
    const attendanceValid = validateChartData(testAttendanceData, 'attendancePercentage');
    
    console.log('\n📊 Testing marks data:');
    const marksValid = validateChartData(testMarksData, 'marksObtained');
    
    console.log('\n🎯 Test Results:');
    console.log(`Attendance data: ${attendanceValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Marks data: ${marksValid ? '✅ Valid' : '❌ Invalid'}`);
    
    return attendanceValid && marksValid;
};

// Export for use in components
export default {
    testAttendanceData,
    testMarksData,
    validateChartData,
    runChartDataTests
};