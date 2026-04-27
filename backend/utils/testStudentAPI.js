const axios = require('axios');
require('dotenv').config();

const testStudentAPI = async () => {
    try {
        console.log('🧪 Testing Student API endpoints...\n');
        
        // Test the student detail endpoint (what the frontend calls)
        const studentId = '696e5fc54f0b3f90691e6d95'; // From previous test
        const baseURL = process.env.BASE_URL || 'http://localhost:5000';
        
        console.log(`📡 Testing GET ${baseURL}/Student/${studentId}`);
        
        const response = await axios.get(`${baseURL}/Student/${studentId}`);
        
        if (response.data) {
            console.log('✅ API Response received');
            console.log(`Student: ${response.data.name} (Roll: ${response.data.rollNum})`);
            
            // Check attendance data
            if (response.data.attendance) {
                console.log(`\n📅 Attendance data: ${response.data.attendance.length} records`);
                if (response.data.attendance.length > 0) {
                    console.log('Sample attendance records:');
                    response.data.attendance.slice(0, 3).forEach((att, index) => {
                        console.log(`  ${index + 1}. Date: ${new Date(att.date).toLocaleDateString()}, Status: ${att.status}`);
                        if (att.subName) {
                            console.log(`      Subject: ${att.subName.subName || 'No name'}, Sessions: ${att.subName.sessions || 'No sessions'}`);
                        } else {
                            console.log('      Subject: NULL or not populated');
                        }
                    });
                } else {
                    console.log('❌ No attendance records in API response');
                }
            } else {
                console.log('❌ No attendance field in API response');
            }
            
            // Check exam results
            if (response.data.examResult) {
                console.log(`\n📝 Exam results: ${response.data.examResult.length} records`);
                if (response.data.examResult.length > 0) {
                    console.log('Sample exam results:');
                    response.data.examResult.slice(0, 3).forEach((result, index) => {
                        console.log(`  ${index + 1}. Marks: ${result.marksObtained}`);
                        if (result.subName) {
                            console.log(`      Subject: ${result.subName.subName || 'No name'}`);
                        } else {
                            console.log('      Subject: NULL or not populated');
                        }
                    });
                } else {
                    console.log('❌ No exam results in API response');
                }
            } else {
                console.log('❌ No examResult field in API response');
            }
            
            // Check class and school info
            console.log(`\n🏫 School: ${response.data.school ? response.data.school.schoolName : 'Not populated'}`);
            console.log(`📚 Class: ${response.data.sclassName ? response.data.sclassName.sclassName : 'Not populated'}`);
            
        } else {
            console.log('❌ No data in API response');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Connection refused - Backend server is not running');
            console.log('💡 Please start the backend server first: npm start');
        } else {
            console.error('❌ API test failed:', error.message);
        }
    }
};

// Run the test
if (require.main === module) {
    testStudentAPI();
}

module.exports = testStudentAPI;