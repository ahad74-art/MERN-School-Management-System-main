const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load models
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const Sclass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');

// Load environment variables
dotenv.config();

async function createBasicGuestAccounts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Hash password for all accounts
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('zxc', salt);

        // 1. Create or update Guest Admin Account
        console.log('Creating/Updating Guest Admin Account...');
        let guestAdmin = await Admin.findOne({ email: 'yogendra@12' });
        if (!guestAdmin) {
            guestAdmin = new Admin({
                name: 'Guest Admin',
                email: 'yogendra@12',
                password: hashedPassword,
                role: 'Admin',
                schoolName: 'Demo School Management System'
            });
            guestAdmin = await guestAdmin.save();
            console.log('✅ Guest Admin created:', guestAdmin._id);
        } else {
            // Update password to ensure it's correct
            guestAdmin.password = hashedPassword;
            await guestAdmin.save();
            console.log('✅ Guest Admin updated:', guestAdmin._id);
        }

        // 2. Create Demo Class if it doesn't exist
        console.log('Creating Demo Class...');
        let demoClass = await Sclass.findOne({ sclassName: 'Demo Class 10A', school: guestAdmin._id });
        if (!demoClass) {
            demoClass = new Sclass({
                sclassName: 'Demo Class 10A',
                school: guestAdmin._id
            });
            demoClass = await demoClass.save();
            console.log('✅ Demo Class created:', demoClass._id);
        } else {
            console.log('✅ Demo Class exists:', demoClass._id);
        }

        // 3. Create Demo Subject if it doesn't exist
        console.log('Creating Demo Subject...');
        let demoSubject = await Subject.findOne({ 
            subCode: 'MATH101', 
            school: guestAdmin._id,
            sclassName: demoClass._id 
        });
        
        if (!demoSubject) {
            demoSubject = new Subject({
                subName: 'Mathematics',
                subCode: 'MATH101',
                sessions: 40,
                sclassName: demoClass._id,
                school: guestAdmin._id
            });
            demoSubject = await demoSubject.save();
            console.log('✅ Demo Subject created:', demoSubject._id);
        } else {
            console.log('✅ Demo Subject exists:', demoSubject._id);
        }

        // 4. Create or update Guest Teacher Account
        console.log('Creating/Updating Guest Teacher Account...');
        let guestTeacher = await Teacher.findOne({ email: 'tony@12' });
        if (!guestTeacher) {
            guestTeacher = new Teacher({
                name: 'Tony Stark',
                email: 'tony@12',
                password: hashedPassword,
                role: 'Teacher',
                school: guestAdmin._id,
                teachSubject: demoSubject._id,
                teachSclass: demoClass._id,
                dateOfBirth: new Date('1980-05-15'),
                gender: 'Male',
                phone: '+1-555-0123',
                address: '123 Demo Street, Demo City, DC 12345'
            });
            guestTeacher = await guestTeacher.save();
            console.log('✅ Guest Teacher created:', guestTeacher._id);
        } else {
            // Update password and ensure proper references
            guestTeacher.password = hashedPassword;
            guestTeacher.school = guestAdmin._id;
            guestTeacher.teachSubject = demoSubject._id;
            guestTeacher.teachSclass = demoClass._id;
            await guestTeacher.save();
            console.log('✅ Guest Teacher updated:', guestTeacher._id);
        }

        // Update subject with teacher reference
        await Subject.findByIdAndUpdate(demoSubject._id, { teacher: guestTeacher._id });

        // 5. Create or update Guest Student Account
        console.log('Creating/Updating Guest Student Account...');
        let guestStudent = await Student.findOne({ 
            rollNum: 1, 
            school: guestAdmin._id,
            sclassName: demoClass._id 
        });
        
        if (!guestStudent) {
            guestStudent = new Student({
                name: 'Dipesh Awasthi',
                rollNum: 1,
                password: hashedPassword,
                sclassName: demoClass._id,
                school: guestAdmin._id,
                role: 'Student',
                dateOfBirth: new Date('2005-08-20'),
                gender: 'Male',
                phone: '+1-555-0125',
                address: '456 Student Lane, Demo City, DC 12345',
                email: 'dipesh.student@demo.com'
            });
            guestStudent = await guestStudent.save();
            console.log('✅ Guest Student created:', guestStudent._id);
        } else {
            // Update password and ensure proper references
            guestStudent.password = hashedPassword;
            guestStudent.school = guestAdmin._id;
            guestStudent.sclassName = demoClass._id;
            await guestStudent.save();
            console.log('✅ Guest Student updated:', guestStudent._id);
        }

        console.log('\n🎉 Guest accounts setup complete!');
        console.log('\n🔑 Guest Login Credentials:');
        console.log('Admin: yogendra@12 / zxc');
        console.log('Teacher: tony@12 / zxc');
        console.log('Student: Roll Number: 1, Name: Dipesh Awasthi, Password: zxc');
        console.log('\n✅ You can now use the guest login feature!');

        await mongoose.disconnect();
        console.log('Database connection closed.');
        
    } catch (error) {
        console.error('❌ Error creating guest accounts:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

// Run the function if this file is executed directly
if (require.main === module) {
    createBasicGuestAccounts();
}

module.exports = createBasicGuestAccounts;