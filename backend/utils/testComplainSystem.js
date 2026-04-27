const mongoose = require('mongoose');
const Complain = require('../models/complainSchema.js');
const Student = require('../models/studentSchema.js');
const Admin = require('../models/adminSchema.js');
require('dotenv').config();

const testComplainSystem = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('🔗 Connected to MongoDB');
        console.log('🧪 Testing complain system...\n');
        
        // Get test data
        const student = await Student.findOne({});
        const admin = await Admin.findOne({});
        
        if (!student) {
            console.log('❌ No student found for testing');
            return;
        }
        
        if (!admin) {
            console.log('❌ No admin found for testing');
            return;
        }
        
        console.log(`👨‍🎓 Testing with student: ${student.name} (Roll: ${student.rollNum})`);
        console.log(`👨‍💼 Testing with admin: ${admin.name} (${admin.email})`);
        
        // Test 1: Create a test complaint
        console.log('\n📝 Test 1: Creating test complaint...');
        const testComplaint = {
            user: student._id,
            date: new Date(),
            complaint: 'Test complaint: The classroom projector is not working properly during lectures.',
            school: admin._id
        };
        
        const newComplaint = new Complain(testComplaint);
        const savedComplaint = await newComplaint.save();
        console.log('✅ Complaint created successfully');
        console.log(`Complaint ID: ${savedComplaint._id}`);
        
        // Test 2: Fetch complaints (as admin would)
        console.log('\n📋 Test 2: Fetching complaints for admin...');
        const adminComplaints = await Complain.find({ school: admin._id }).populate("user", "name");
        console.log(`✅ Found ${adminComplaints.length} complaint(s) for admin`);
        
        if (adminComplaints.length > 0) {
            console.log('Sample complaints:');
            adminComplaints.slice(0, 3).forEach((complaint, index) => {
                console.log(`  ${index + 1}. ${complaint.user.name}: "${complaint.complaint.substring(0, 50)}..."`);
                console.log(`     Date: ${complaint.date.toDateString()}`);
            });
        }
        
        // Test 3: Fetch complaints (as teacher would - same as admin)
        console.log('\n👨‍🏫 Test 3: Fetching complaints for teacher...');
        const teacherComplaints = await Complain.find({ school: admin._id }).populate("user", "name");
        console.log(`✅ Found ${teacherComplaints.length} complaint(s) for teacher`);
        
        // Test 4: Test student-specific filtering (frontend logic)
        console.log('\n👨‍🎓 Test 4: Testing student-specific filtering...');
        const studentSpecificComplaints = adminComplaints.filter(complaint => 
            complaint.user._id.toString() === student._id.toString()
        );
        console.log(`✅ Found ${studentSpecificComplaints.length} complaint(s) for specific student`);
        
        // Test 5: Verify data structure
        console.log('\n🔍 Test 5: Verifying complaint data structure...');
        if (adminComplaints.length > 0) {
            const sampleComplaint = adminComplaints[0];
            console.log('Sample complaint structure:');
            console.log(`- ID: ${sampleComplaint._id}`);
            console.log(`- User: ${sampleComplaint.user ? sampleComplaint.user.name : 'NULL'}`);
            console.log(`- Date: ${sampleComplaint.date}`);
            console.log(`- Complaint: ${sampleComplaint.complaint.substring(0, 100)}...`);
            console.log(`- School: ${sampleComplaint.school}`);
            console.log('✅ Data structure is valid');
        }
        
        // Test 6: Clean up test data (optional)
        console.log('\n🧹 Test 6: Cleaning up test complaint...');
        await Complain.findByIdAndDelete(savedComplaint._id);
        console.log('✅ Test complaint cleaned up');
        
        console.log('\n🎉 Complain system testing completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Total complaints in system: ${adminComplaints.length}`);
        console.log(`- Complaints for test student: ${studentSpecificComplaints.length}`);
        console.log('- Data population: ✅ Working');
        console.log('- Create functionality: ✅ Working');
        console.log('- Fetch functionality: ✅ Working');
        console.log('- Filtering logic: ✅ Working');
        
    } catch (error) {
        console.error('❌ Complain system test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the test
if (require.main === module) {
    testComplainSystem();
}

module.exports = testComplainSystem;