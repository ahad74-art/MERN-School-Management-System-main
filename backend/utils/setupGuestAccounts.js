const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const Sclass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');
const Notice = require('../models/noticeSchema');
const Complain = require('../models/complainSchema');
const Lecture = require('../models/lectureSchema');

async function setupGuestAccounts() {
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

        // 1. Create/Update Guest Admin
        let guestAdmin = await Admin.findOne({ email: 'yogendra@12' });
        if (!guestAdmin) {
            guestAdmin = new Admin({
                name: 'Guest Admin',
                email: 'yogendra@12',
                password: hashedPassword,
                role: 'Admin',
                schoolName: 'Demo School System'
            });
            await guestAdmin.save();
            console.log('Created guest admin account');
        } else {
            guestAdmin.password = hashedPassword;
            await guestAdmin.save();
            console.log('Updated guest admin password');
        }

        // 2. Create/Update Demo Class
        let demoClass = await Sclass.findOne({ sclassName: 'Demo Class 10A', school: guestAdmin._id });
        if (!demoClass) {
            demoClass = new Sclass({
                sclassName: 'Demo Class 10A',
                school: guestAdmin._id
            });
            await demoClass.save();
            console.log('Created demo class');
        }

        // 3. Create Demo Subjects
        const subjectNames = [
            { name: 'Mathematics', code: 'MATH101' },
            { name: 'Physics', code: 'PHY101' },
            { name: 'Chemistry', code: 'CHEM101' },
            { name: 'English', code: 'ENG101' },
            { name: 'Computer Science', code: 'CS101' }
        ];

        const subjects = [];
        for (const subjectData of subjectNames) {
            let subject = await Subject.findOne({ 
                subCode: subjectData.code, 
                school: guestAdmin._id,
                sclassName: demoClass._id 
            });
            
            if (!subject) {
                subject = new Subject({
                    subName: subjectData.name,
                    subCode: subjectData.code,
                    sessions: 40,
                    sclassName: demoClass._id,
                    school: guestAdmin._id
                });
                await subject.save();
                console.log(`Created subject: ${subjectData.name}`);
            }
            subjects.push(subject);
        }

        // 4. Create/Update Guest Teacher
        let guestTeacher = await Teacher.findOne({ email: 'tony@12' });
        if (!guestTeacher) {
            guestTeacher = new Teacher({
                name: 'Tony Stark',
                email: 'tony@12',
                password: hashedPassword,
                role: 'Teacher',
                school: guestAdmin._id,
                teachSclass: demoClass._id,
                teachSubject: subjects[0]._id, // Assign Mathematics
                dateOfBirth: new Date('1980-05-15'),
                gender: 'Male',
                phone: '+1-555-0123',
                address: '123 Demo Street, Demo City'
            });
            await guestTeacher.save();
            console.log('Created guest teacher account');
        } else {
            guestTeacher.password = hashedPassword;
            guestTeacher.school = guestAdmin._id;
            guestTeacher.teachSclass = demoClass._id;
            guestTeacher.teachSubject = subjects[0]._id;
            await guestTeacher.save();
            console.log('Updated guest teacher');
        }

        // Update subject with teacher
        subjects[0].teacher = guestTeacher._id;
        await subjects[0].save();

        // 5. Create/Update Guest Student
        let guestStudent = await Student.findOne({ rollNum: 1, school: guestAdmin._id });
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
                phone: '+1-555-0124',
                address: '456 Student Lane, Demo City',
                email: 'dipesh.demo@school.com'
            });
            await guestStudent.save();
            console.log('Created guest student account');
        } else {
            guestStudent.password = hashedPassword;
            guestStudent.sclassName = demoClass._id;
            guestStudent.school = guestAdmin._id;
            await guestStudent.save();
            console.log('Updated guest student');
        }

        // 6. Add Sample Attendance Data
        const attendanceData = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            for (const subject of subjects.slice(0, 3)) { // First 3 subjects
                attendanceData.push({
                    subName: subject._id,
                    status: Math.random() > 0.2 ? 'Present' : 'Absent', // 80% attendance
                    date: date
                });
            }
        }
        
        guestStudent.attendance = attendanceData;
        await guestStudent.save();

        // 7. Add Sample Exam Results
        const examResults = subjects.slice(0, 3).map(subject => ({
            subName: subject._id,
            marksObtained: Math.floor(Math.random() * 30) + 70 // 70-100 marks
        }));
        
        guestStudent.examResult = examResults;
        await guestStudent.save();

        // 8. Create Sample Notices
        const notices = [
            {
                title: 'Welcome to Demo School System',
                details: 'This is a demonstration of our comprehensive school management system. Explore all features!',
                date: new Date(),
                school: guestAdmin._id
            },
            {
                title: 'New Lecture Module Available',
                details: 'Teachers can now upload video lectures and students can view them with progress tracking.',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                school: guestAdmin._id
            },
            {
                title: 'Chat System Implemented',
                details: 'Students and teachers can now communicate through our real-time chat system.',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                school: guestAdmin._id
            }
        ];

        for (const noticeData of notices) {
            const existingNotice = await Notice.findOne({ 
                title: noticeData.title, 
                school: guestAdmin._id 
            });
            if (!existingNotice) {
                const notice = new Notice(noticeData);
                await notice.save();
                console.log(`Created notice: ${noticeData.title}`);
            }
        }

        // 9. Create Sample Complaints
        const complaints = [
            {
                user: guestStudent._id,
                complaint: 'The WiFi in the library is not working properly. Please fix it.',
                school: guestAdmin._id,
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                status: 'Pending'
            },
            {
                user: guestStudent._id,
                complaint: 'Request for additional study materials for Mathematics.',
                school: guestAdmin._id,
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'Resolved'
            }
        ];

        for (const complainData of complaints) {
            const existingComplain = await Complain.findOne({ 
                complaint: complainData.complaint,
                user: complainData.user 
            });
            if (!existingComplain) {
                const complain = new Complain(complainData);
                await complain.save();
                console.log('Created sample complaint');
            }
        }

        // 10. Create Sample Lectures
        const lectures = [
            {
                title: 'Introduction to Algebra',
                description: 'Basic concepts of algebra including variables, equations, and problem-solving techniques.',
                subject: subjects[0]._id, // Mathematics
                teacher: guestTeacher._id,
                sclass: demoClass._id,
                school: guestAdmin._id,
                lectureType: 'text',
                content: {
                    textContent: `# Introduction to Algebra

## What is Algebra?
Algebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations.

## Key Concepts:
1. **Variables**: Letters that represent unknown numbers (x, y, z)
2. **Constants**: Fixed numbers (1, 2, 3, etc.)
3. **Expressions**: Combinations of variables and constants (2x + 3)
4. **Equations**: Mathematical statements that show equality (2x + 3 = 7)

## Basic Operations:
- Addition and Subtraction
- Multiplication and Division
- Solving for variables

## Practice Problems:
1. Solve for x: 2x + 5 = 15
2. Simplify: 3x + 2x - 4
3. If x = 3, find the value of 2x² + 5x - 1

Remember: The key to mastering algebra is practice and understanding the underlying concepts!`
                },
                difficulty: 'Beginner',
                estimatedDuration: 45,
                tags: ['algebra', 'mathematics', 'basics'],
                isPublished: true,
                publishedAt: new Date(),
                viewCount: 15,
                viewedBy: [{
                    student: guestStudent._id,
                    viewedAt: new Date(),
                    progress: 85,
                    completed: false,
                    watchTime: 0
                }]
            },
            {
                title: 'Newton\'s Laws of Motion',
                description: 'Understanding the three fundamental laws that govern motion in physics.',
                subject: subjects[1]._id, // Physics
                teacher: guestTeacher._id,
                sclass: demoClass._id,
                school: guestAdmin._id,
                lectureType: 'text',
                content: {
                    textContent: `# Newton's Laws of Motion

## First Law (Law of Inertia)
An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

**Example**: A book on a table remains at rest until someone pushes it.

## Second Law (F = ma)
The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.

**Formula**: F = ma
- F = Force (Newtons)
- m = Mass (kg)
- a = Acceleration (m/s²)

## Third Law (Action-Reaction)
For every action, there is an equal and opposite reaction.

**Example**: When you walk, you push backward on the ground, and the ground pushes forward on you.

## Applications:
1. Car safety (seatbelts, airbags)
2. Rocket propulsion
3. Sports (running, jumping)
4. Engineering design

## Practice Questions:
1. Calculate the force needed to accelerate a 10kg object at 5m/s²
2. Explain why passengers lurch forward when a car suddenly stops
3. How do rockets work in space where there's no air to push against?`
                },
                difficulty: 'Intermediate',
                estimatedDuration: 60,
                tags: ['physics', 'motion', 'newton', 'laws'],
                isPublished: true,
                publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                viewCount: 12,
                comments: [{
                    student: guestStudent._id,
                    comment: 'Great explanation! The examples really helped me understand.',
                    timestamp: 0,
                    createdAt: new Date()
                }]
            },
            {
                title: 'Chemical Bonding Basics',
                description: 'Introduction to ionic and covalent bonds in chemistry.',
                subject: subjects[2]._id, // Chemistry
                teacher: guestTeacher._id,
                sclass: demoClass._id,
                school: guestAdmin._id,
                lectureType: 'text',
                content: {
                    textContent: `# Chemical Bonding

## What are Chemical Bonds?
Chemical bonds are forces that hold atoms together in compounds.

## Types of Bonds:

### 1. Ionic Bonds
- Formed between metals and non-metals
- Transfer of electrons
- Example: NaCl (Sodium Chloride)

### 2. Covalent Bonds
- Formed between non-metals
- Sharing of electrons
- Example: H₂O (Water)

### 3. Metallic Bonds
- Found in metals
- Sea of electrons
- Example: Iron, Copper

## Properties:
- **Ionic compounds**: High melting points, conduct electricity when dissolved
- **Covalent compounds**: Lower melting points, usually don't conduct electricity
- **Metals**: Malleable, ductile, good conductors

## Lewis Structures:
Learn to draw electron dot diagrams to represent bonding.

## Practice:
1. Identify the type of bond in CO₂
2. Draw the Lewis structure for CH₄
3. Explain why salt dissolves in water`
                },
                difficulty: 'Intermediate',
                estimatedDuration: 50,
                tags: ['chemistry', 'bonding', 'ionic', 'covalent'],
                isPublished: true,
                publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                viewCount: 8
            }
        ];

        for (const lectureData of lectures) {
            const existingLecture = await Lecture.findOne({ 
                title: lectureData.title,
                teacher: guestTeacher._id 
            });
            if (!existingLecture) {
                const lecture = new Lecture(lectureData);
                await lecture.save();
                console.log(`Created lecture: ${lectureData.title}`);
            }
        }

        console.log('\n=== GUEST ACCOUNTS SETUP COMPLETE ===');
        console.log('Admin Login: yogendra@12 / zxc');
        console.log('Teacher Login: tony@12 / zxc');
        console.log('Student Login: Roll Number: 1, Name: Dipesh Awasthi, Password: zxc');
        console.log('\nFeatures available:');
        console.log('✓ Complete user management');
        console.log('✓ Class and subject management');
        console.log('✓ Student attendance tracking');
        console.log('✓ Exam results and grades');
        console.log('✓ Notice board system');
        console.log('✓ Complaint management');
        console.log('✓ Real-time chat system');
        console.log('✓ Lecture module with content');
        console.log('✓ Profile editing');
        console.log('✓ Analytics and reporting');

        await mongoose.disconnect();
        console.log('\nDatabase connection closed');
        
    } catch (error) {
        console.error('Error setting up guest accounts:', error);
        process.exit(1);
    }
}

// Run the setup
setupGuestAccounts();