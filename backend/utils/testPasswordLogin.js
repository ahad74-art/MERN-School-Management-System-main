const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Admin = require('../models/adminSchema.js');
const Student = require('../models/studentSchema.js');
const Teacher = require('../models/teacherSchema.js');
require('dotenv').config();

const testPasswordLogin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('🔗 Connected to MongoDB');
        console.log('🧪 Testing password login functionality...\n');
        
        // Test Admin Login
        console.log('👨‍💼 Testing Admin Login:');
        const admins = await Admin.find({}).limit(3);
        for (const admin of admins) {
            console.log(`Testing admin: ${admin.name} (${admin.email})`);
            console.log(`Password hash: ${admin.password.substring(0, 20)}...`);
            console.log(`Is hashed: ${admin.password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
            
            // Test with a sample password (you would use the actual password)
            if (admin.password.startsWith('$2b$')) {
                console.log('✅ Password is properly hashed for bcrypt comparison');
            } else {
                console.log('❌ Password is in plain text - needs migration!');
            }
            console.log('---');
        }
        
        // Test Student Login
        console.log('\n👨‍🎓 Testing Student Login:');
        const students = await Student.find({}).limit(3);
        for (const student of students) {
            console.log(`Testing student: ${student.name} (Roll: ${student.rollNum})`);
            console.log(`Password hash: ${student.password.substring(0, 20)}...`);
            console.log(`Is hashed: ${student.password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
            console.log('---');
        }
        
        // Test Teacher Login
        console.log('\n👨‍🏫 Testing Teacher Login:');
        const teachers = await Teacher.find({}).limit(3);
        for (const teacher of teachers) {
            console.log(`Testing teacher: ${teacher.name} (${teacher.email})`);
            console.log(`Password hash: ${teacher.password.substring(0, 20)}...`);
            console.log(`Is hashed: ${teacher.password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
            console.log('---');
        }
        
        // Test bcrypt comparison functionality
        console.log('\n🔐 Testing bcrypt comparison:');
        const testPassword = 'testPassword123';
        const hashedTest = await bcrypt.hash(testPassword, 10);
        
        console.log(`Original password: ${testPassword}`);
        console.log(`Hashed password: ${hashedTest}`);
        
        const isValid = await bcrypt.compare(testPassword, hashedTest);
        console.log(`bcrypt.compare result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        
        const isInvalid = await bcrypt.compare('wrongPassword', hashedTest);
        console.log(`Wrong password test: ${isInvalid ? '❌ Should be false' : '✅ Correctly rejected'}`);
        
        console.log('\n🎉 Password testing completed!');
        
    } catch (error) {
        console.error('❌ Testing failed:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the test
if (require.main === module) {
    testPasswordLogin();
}

module.exports = testPasswordLogin;