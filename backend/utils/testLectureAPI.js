const axios = require('axios');
const FormData = require('form-data');

async function testLectureAPI() {
    try {
        const formData = new FormData();
        
        // Add test data
        formData.append('title', 'Test API Lecture');
        formData.append('description', 'This is a test lecture via API');
        formData.append('subject', '507f1f77bcf86cd799439011'); // Dummy ObjectId
        formData.append('teacher', '507f1f77bcf86cd799439012'); // Dummy ObjectId
        formData.append('sclass', '507f1f77bcf86cd799439013'); // Dummy ObjectId
        formData.append('school', '507f1f77bcf86cd799439014'); // Dummy ObjectId
        formData.append('lectureType', 'text');
        formData.append('textContent', 'This is test content for the API lecture.');
        formData.append('difficulty', 'Beginner');
        formData.append('estimatedDuration', '30');
        formData.append('tags', 'test, api, sample');
        formData.append('isPublished', 'true');

        console.log('Sending API request...');
        
        const response = await axios.post('http://localhost:5000/LectureCreate', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log('API Response:', response.status, response.statusText);
        console.log('Created lecture:', response.data);
        
    } catch (error) {
        console.error('API Error:', error.response?.status, error.response?.statusText);
        console.error('Error data:', error.response?.data);
        console.error('Full error:', error.message);
    }
}

testLectureAPI();