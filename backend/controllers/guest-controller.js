const bcrypt = require('bcrypt');
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const Sclass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');

// Create guest accounts
const createGuestAccounts = async (req, res) => {
    try {
        console.log('Creating guest accounts...');
        
        // Hash password for all accounts
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('zxc', salt);

        // 1. Create or update Guest Admin Account
        let guestAdmin = await Admin.findOne({ email: 'guestadmin@gmail.com' });
        if (!guestAdmin) {
            const schoolName = 'Demo School ' + Date.now();
            guestAdmin = new Admin({
                name: 'Guest Admin',
                email: 'guestadmin@gmail.com',
                password: hashedPassword,
                role: 'Admin',
                schoolName
            });
            guestAdmin = await guestAdmin.save();
        } else {
            guestAdmin.password = hashedPassword;
            await guestAdmin.save();
        }

        // 2. Create Demo Class
        let demoClass = await Sclass.findOne({ sclassName: 'Demo Class 10A', school: guestAdmin._id });
        if (!demoClass) {
            demoClass = new Sclass({
                sclassName: 'Demo Class 10A',
                school: guestAdmin._id
            });
            demoClass = await demoClass.save();
        }

        // 3. Create Demo Subject
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
        }

        // 4. Create or update Guest Teacher Account
        let guestTeacher = await Teacher.findOne({ email: 'tony@12' });
        if (!guestTeacher) {
            guestTeacher = new Teacher({
                name: 'Tony Stark',
                email: 'tony@12',
                password: hashedPassword,
                role: 'Teacher',
                school: guestAdmin._id,
                teachSubject: demoSubject._id,
                teachSclass: [demoClass._id],
                dateOfBirth: new Date('1980-05-15'),
                gender: 'Male',
                phone: '+1-555-0123',
                address: '123 Demo Street, Demo City, DC 12345'
            });
            guestTeacher = await guestTeacher.save();
        } else {
            guestTeacher.password = hashedPassword;
            guestTeacher.school = guestAdmin._id;
            guestTeacher.teachSubject = demoSubject._id;
            guestTeacher.teachSclass = [demoClass._id];
            await guestTeacher.save();
        }

        // Update subject with teacher reference
        await Subject.findByIdAndUpdate(demoSubject._id, { teacher: guestTeacher._id });

        // 5. Create or update Guest Student Account
        let guestStudent = await Student.findOne({ 
            rollNum: 1,
            name: 'Guest Student'
        });
        
        if (!guestStudent) {
            guestStudent = new Student({
                name: 'Guest Student',
                rollNum: 1,
                password: hashedPassword,
                sclassName: demoClass._id,
                school: guestAdmin._id,
                role: 'Student',
                dateOfBirth: new Date('2005-08-20'),
                gender: 'Male',
                phone: '+1-555-0125',
                address: '456 Student Lane, Demo City, DC 12345',
                email: 'gueststudent@gmail.com'
            });
            guestStudent = await guestStudent.save();
        } else {
            guestStudent.password = hashedPassword;
            guestStudent.school = guestAdmin._id;
            guestStudent.sclassName = demoClass._id;
            guestStudent.email = 'gueststudent@gmail.com';
            await guestStudent.save();
        }

        res.json({
            success: true,
            message: 'Guest accounts created successfully',
            accounts: {
                admin: { email: 'guestadmin@gmail.com', password: 'zxc' },
                teacher: { email: 'tony@12', password: 'zxc' },
                student: { rollNum: 1, name: 'Dipesh Awasthi', password: 'zxc' }
            }
        });

    } catch (error) {
        console.error('Error creating guest accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating guest accounts',
            error: error.message
        });
    }
};

// Check guest accounts status
const checkGuestAccounts = async (req, res) => {
    try {
        const guestAdmin = await Admin.findOne({ email: 'guestadmin@gmail.com' });
        const guestTeacher = await Teacher.findOne({ email: 'tony@12' });
        const guestStudent = await Student.findOne({ rollNum: 1, name: 'Dipesh Awasthi' });

        res.json({
            success: true,
            accounts: {
                admin: !!guestAdmin,
                teacher: !!guestTeacher,
                student: !!guestStudent
            },
            details: {
                admin: guestAdmin ? { name: guestAdmin.name, email: guestAdmin.email } : null,
                teacher: guestTeacher ? { name: guestTeacher.name, email: guestTeacher.email } : null,
                student: guestStudent ? { name: guestStudent.name, rollNum: guestStudent.rollNum } : null
            }
        });

    } catch (error) {
        console.error('Error checking guest accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking guest accounts',
            error: error.message
        });
    }
};

module.exports = {
    createGuestAccounts,
    checkGuestAccounts
};