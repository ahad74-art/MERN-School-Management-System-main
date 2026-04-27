const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');

dotenv.config();

async function checkGuestAccounts() {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check existing guest accounts
        const guestAdmin = await Admin.findOne({ email: 'yogendra@12' });
        const guestTeacher = await Teacher.findOne({ email: 'tony@12' });
        const guestStudent = await Student.findOne({ rollNum: 1, name: 'Dipesh Awasthi' });

        console.log('Guest Admin exists:', !!guestAdmin);
        console.log('Guest Teacher exists:', !!guestTeacher);
        console.log('Guest Student exists:', !!guestStudent);

        if (guestAdmin) {
            console.log('Admin details:', {
                name: guestAdmin.name,
                email: guestAdmin.email,
                schoolName: guestAdmin.schoolName
            });
        }

        if (guestTeacher) {
            console.log('Teacher details:', {
                name: guestTeacher.name,
                email: guestTeacher.email
            });
        }

        if (guestStudent) {
            console.log('Student details:', {
                name: guestStudent.name,
                rollNum: guestStudent.rollNum
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkGuestAccounts();