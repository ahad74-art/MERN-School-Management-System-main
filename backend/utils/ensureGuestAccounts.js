const bcrypt = require('bcrypt');

// Simple function to ensure guest accounts exist
async function ensureGuestAccounts() {
    try {
        const Admin = require('../models/adminSchema');
        const Teacher = require('../models/teacherSchema');
        const Student = require('../models/studentSchema');
        
        console.log('Checking guest accounts...');
        
        // Check if guest accounts exist
        const guestAdmin = await Admin.findOne({ email: 'yogendra@12' });
        const guestTeacher = await Teacher.findOne({ email: 'tony@12' });
        const guestStudent = await Student.findOne({ rollNum: 1, name: 'Dipesh Awasthi' });
        
        console.log('Guest Admin exists:', !!guestAdmin);
        console.log('Guest Teacher exists:', !!guestTeacher);
        console.log('Guest Student exists:', !!guestStudent);
        
        if (guestAdmin && guestTeacher && guestStudent) {
            console.log('✅ All guest accounts are available!');
            console.log('🎯 Guest Login Credentials:');
            console.log('Admin: yogendra@12 / zxc');
            console.log('Teacher: tony@12 / zxc');
            console.log('Student: Roll Number: 1, Name: Dipesh Awasthi, Password: zxc');
        } else {
            console.log('⚠️  Some guest accounts are missing. The existing guest login should still work if the accounts exist.');
            console.log('💡 If guest login fails, you may need to create the accounts manually or run the full setup script.');
        }
        
        return {
            adminExists: !!guestAdmin,
            teacherExists: !!guestTeacher,
            studentExists: !!guestStudent
        };
        
    } catch (error) {
        console.log('Error checking guest accounts:', error.message);
        return { error: error.message };
    }
}

module.exports = ensureGuestAccounts;