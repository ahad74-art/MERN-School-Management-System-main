const mongoose = require('mongoose');
const Student = require('../models/studentSchema.js');
const Subject = require('../models/subjectSchema.js');
const Admin = require('../models/adminSchema.js');
const Sclass = require('../models/sclassSchema.js');
require('dotenv').config();

const addTestData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('🔗 Connected to MongoDB');
        console.log('🧪 Adding test attendance and exam data...\n');
        
        // Get a student and subjects
        const student = await Student.findOne({});
        const subjects = await Subject.find({}).limit(3);
        
        if (!student) {
            console.log('❌ No student found');
            return;
        }
        
        if (subjects.length === 0) {
            console.log('❌ No subjects found');
            return;
        }
        
        console.log(`👨‍🎓 Working with student: ${student.name} (Roll: ${student.rollNum})`);
        console.log(`📚 Found ${subjects.length} subjects`);
        
        // Add more attendance records
        console.log('\n📅 Adding attendance records...');
        const attendanceToAdd = [
            { date: new Date('2026-01-15'), status: 'Present', subName: subjects[0]._id },
            { date: new Date('2026-01-16'), status: 'Absent', subName: subjects[0]._id },
            { date: new Date('2026-01-17'), status: 'Present', subName: subjects[1]._id },
            { date: new Date('2026-01-18'), status: 'Present', subName: subjects[1]._id },
            { date: new Date('2026-01-19'), status: 'Absent', subName: subjects[2]._id },
        ];
        
        for (const att of attendanceToAdd) {
            // Check if attendance already exists for this date and subject
            const existingAttendance = student.attendance.find(
                (a) => a.date.toDateString() === att.date.toDateString() && 
                       a.subName.toString() === att.subName.toString()
            );
            
            if (!existingAttendance) {
                student.attendance.push(att);
                console.log(`✅ Added attendance: ${att.date.toDateString()} - ${att.status} for subject ${att.subName}`);
            } else {
                console.log(`⏭️  Attendance already exists for ${att.date.toDateString()}`);
            }
        }
        
        // Add exam results
        console.log('\n📝 Adding exam results...');
        const examResultsToAdd = [
            { subName: subjects[0]._id, marksObtained: 85 },
            { subName: subjects[1]._id, marksObtained: 92 },
            { subName: subjects[2]._id, marksObtained: 78 },
        ];
        
        for (const result of examResultsToAdd) {
            // Check if exam result already exists for this subject
            const existingResult = student.examResult.find(
                (r) => r.subName.toString() === result.subName.toString()
            );
            
            if (!existingResult) {
                student.examResult.push(result);
                console.log(`✅ Added exam result: ${result.marksObtained} marks for subject ${result.subName}`);
            } else {
                existingResult.marksObtained = result.marksObtained;
                console.log(`🔄 Updated exam result: ${result.marksObtained} marks for subject ${result.subName}`);
            }
        }
        
        // Save the student
        await student.save();
        console.log('\n💾 Student data saved successfully!');
        
        // Verify the data
        console.log('\n🔍 Verifying added data...');
        const updatedStudent = await Student.findById(student._id)
            .populate("attendance.subName", "subName sessions")
            .populate("examResult.subName", "subName");
        
        console.log(`📅 Total attendance records: ${updatedStudent.attendance.length}`);
        console.log(`📝 Total exam results: ${updatedStudent.examResult.length}`);
        
        if (updatedStudent.attendance.length > 0) {
            console.log('\nSample attendance records:');
            updatedStudent.attendance.slice(0, 3).forEach((att, index) => {
                console.log(`  ${index + 1}. ${att.date.toDateString()} - ${att.status} - ${att.subName ? att.subName.subName : 'Unknown Subject'}`);
            });
        }
        
        if (updatedStudent.examResult.length > 0) {
            console.log('\nSample exam results:');
            updatedStudent.examResult.forEach((result, index) => {
                console.log(`  ${index + 1}. ${result.subName ? result.subName.subName : 'Unknown Subject'} - ${result.marksObtained} marks`);
            });
        }
        
        console.log('\n🎉 Test data added successfully!');
        
    } catch (error) {
        console.error('❌ Failed to add test data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the script
if (require.main === module) {
    addTestData();
}

module.exports = addTestData;