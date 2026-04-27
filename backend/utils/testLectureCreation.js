const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lecture = require('../models/lectureSchema');

// Load environment variables
dotenv.config();

// Test lecture creation
async function testLectureCreation() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Test data
        const testLecture = {
            title: 'Test Lecture',
            description: 'This is a test lecture',
            subject: new mongoose.Types.ObjectId(), // Use a dummy ObjectId
            teacher: new mongoose.Types.ObjectId(), // Use a dummy ObjectId
            sclass: new mongoose.Types.ObjectId(), // Use a dummy ObjectId
            school: new mongoose.Types.ObjectId(), // Use a dummy ObjectId
            lectureType: 'text',
            content: {
                textContent: 'This is test content for the lecture.'
            },
            difficulty: 'Beginner',
            estimatedDuration: 30,
            tags: ['test', 'sample'],
            isPublished: true,
            publishedAt: new Date()
        };

        console.log('Creating test lecture with data:', testLecture);

        const newLecture = new Lecture(testLecture);
        const savedLecture = await newLecture.save();

        console.log('Successfully created lecture:', savedLecture._id);
        
        // Clean up
        await Lecture.findByIdAndDelete(savedLecture._id);
        console.log('Test lecture deleted');

        await mongoose.disconnect();
        console.log('Test completed successfully');
    } catch (error) {
        console.error('Test failed:', error);
        console.error('Error details:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
        process.exit(1);
    }
}

testLectureCreation();