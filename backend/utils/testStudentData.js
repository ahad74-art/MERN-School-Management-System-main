const mongoose = require('mongoose');
const Student = require('../models/studentSchema.js');
const Subject = require('../models/subjectSchema.js');
const Admin = require('../models/adminSchema.js');
const Sclass = require('../models/sclassSchema.js');
require('dotenv').config();

const testStudentData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('🔗 Connected to MongoDB');
        console.log('🧪 Testing student attendance and subjects data...\n');
        
        // Get a student from database
        const student = await Student.findOne({});
        if (!student) {
            console.log('❌ No student found in database');
            return;
        }
        
        console.log(`👨‍🎓 Testing with student: ${student.name} (Roll: ${student.rollNum})`);
        console.log(`Student ID: ${student._id}`);
        
        // Test 1: Check raw student data
        console.log('\n📊 Raw Student Data:');
        console.log(`Attendance records: ${student.attendance ? student.attendance.length : 0}`);
        console.log(`Exam results: ${student.examResult ? student.examResult.length : 0}`);
        
        if (student.attendance && student.attendance.length > 0) {
            console.log('\n📅 Sample Attendance Records:');
            student.attendance.slice(0, 3).forEach((att, index) => {
                console.log(`  ${index + 1}. Date: ${att.date}, Status: ${att.status}, Subject ID: ${att.subName}`);
            });
        } else {
            console.log('❌ No attendance records found');
        }
        
        if (student.examResult && student.examResult.length > 0) {
            console.log('\n📝 Sample Exam Results:');
            student.examResult.slice(0, 3).forEach((result, index) => {
                console.log(`  ${index + 1}. Subject ID: ${result.subName}, Marks: ${result.marksObtained}`);
            });
        } else {
            console.log('❌ No exam results found');
        }
        
        // Test 2: Test the getStudentDetail function (with population)
        console.log('\n🔍 Testing getStudentDetail function (with population):');
        const populatedStudent = await Student.findById(student._id)
            .populate("school", "schoolName")
            .populate("sclassName", "sclassName")
            .populate("examResult.subName", "subName")
            .populate("attendance.subName", "subName sessions");
        
        if (populatedStudent) {
            console.log('✅ Student found with population');
            console.log(`Attendance records after population: ${populatedStudent.attendance ? populatedStudent.attendance.length : 0}`);
            console.log(`Exam results after population: ${populatedStudent.examResult ? populatedStudent.examResult.length : 0}`);
            
            if (populatedStudent.attendance && populatedStudent.attendance.length > 0) {
                console.log('\n📅 Populated Attendance Records:');
                populatedStudent.attendance.slice(0, 3).forEach((att, index) => {
                    console.log(`  ${index + 1}. Date: ${att.date}, Status: ${att.status}`);
                    console.log(`      Subject: ${att.subName ? att.subName.subName : 'NULL'}, Sessions: ${att.subName ? att.subName.sessions : 'NULL'}`);
                });
            }
            
            if (populatedStudent.examResult && populatedStudent.examResult.length > 0) {
                console.log('\n📝 Populated Exam Results:');
                populatedStudent.examResult.slice(0, 3).forEach((result, index) => {
                    console.log(`  ${index + 1}. Subject: ${result.subName ? result.subName.subName : 'NULL'}, Marks: ${result.marksObtained}`);
                });
            }
        } else {
            console.log('❌ Student not found during population');
        }
        
        // Test 3: Check subjects in database
        console.log('\n📚 Checking subjects in database:');
        const subjects = await Subject.find({}).limit(5);
        console.log(`Found ${subjects.length} subjects:`);
        subjects.forEach((subject, index) => {
            console.log(`  ${index + 1}. ${subject.subName} (${subject.subCode}) - Sessions: ${subject.sessions}`);
        });
        
        // Test 4: Check if attendance references valid subjects
        if (student.attendance && student.attendance.length > 0) {
            console.log('\n🔗 Checking attendance subject references:');
            for (let i = 0; i < Math.min(3, student.attendance.length); i++) {
                const att = student.attendance[i];
                const subject = await Subject.findById(att.subName);
                if (subject) {
                    console.log(`  ✅ Attendance ${i + 1}: Valid subject reference - ${subject.subName}`);
                } else {
                    console.log(`  ❌ Attendance ${i + 1}: Invalid subject reference - ${att.subName}`);
                }
            }
        }
        
        // Test 5: Check if exam results reference valid subjects
        if (student.examResult && student.examResult.length > 0) {
            console.log('\n🔗 Checking exam result subject references:');
            for (let i = 0; i < Math.min(3, student.examResult.length); i++) {
                const result = student.examResult[i];
                const subject = await Subject.findById(result.subName);
                if (subject) {
                    console.log(`  ✅ Exam result ${i + 1}: Valid subject reference - ${subject.subName}`);
                } else {
                    console.log(`  ❌ Exam result ${i + 1}: Invalid subject reference - ${result.subName}`);
                }
            }
        }
        
        console.log('\n🎉 Student data testing completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the test
if (require.main === module) {
    testStudentData();
}

module.exports = testStudentData;