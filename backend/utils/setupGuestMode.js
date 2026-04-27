const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const Sclass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');
const Notice = require('../models/noticeSchema');
const Complain = require('../models/complainSchema');
const Lecture = require('../models/lectureSchema');

async function setupGuestMode() {
    try {
        console.log('Setting up guest mode...');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('zxc', salt);

        // 1. Create or update Guest Admin
        let guestAdmin = await Admin.findOne({ email: 'yogendra@12' });
        if (!guestAdmin) {
            guestAdmin = new Admin({
                name: 'Guest Admin',
                email: 'yogendra@12',
                password: hashedPassword,
                role: 'Admin',
                schoolName: 'Demo School System',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'Male',
                phone: '+1234567890',
                address: '123 Demo Street, Demo City',
                emergencyContact: '+1234567891'
            });
            await guestAdmin.save();
            console.log('✓ Created guest admin account');
        } else {
            console.log('✓ Guest admin account already exists');
        }

        // 2. Create Guest Classes
        const classNames = ['Class 10A', 'Class 10B', 'Class 11A', 'Class 12A'];
        const guestClasses = [];
        
        for (const className of classNames) {
            let guestClass = await Sclass.findOne({ sclassName: className, school: guestAdmin._id });
            if (!guestClass) {
                guestClass = new Sclass({
                    sclassName: className,
                    school: guestAdmin._id
                });
                await guestClass.save();
                console.log(`✓ Created class: ${className}`);
            }
            guestClasses.push(guestClass);
        }

        // 3. Create Guest Subjects
        const subjects = [
            { name: 'Mathematics', code: 'MATH101', sessions: 40 },
            { name: 'Physics', code: 'PHY101', sessions: 35 },
            { name: 'Chemistry', code: 'CHEM101', sessions: 35 },
            { name: 'Biology', code: 'BIO101', sessions: 30 },
            { name: 'English', code: 'ENG101', sessions: 25 },
            { name: 'Computer Science', code: 'CS101', sessions: 30 }
        ];

        const guestSubjects = [];
        for (const subjectData of subjects) {
            for (const guestClass of guestClasses) {
                let guestSubject = await Subject.findOne({ 
                    subName: subjectData.name,
                    sclassName: guestClass._id,
                    school: guestAdmin._id 
                });
                
                if (!guestSubject) {
                    guestSubject = new Subject({
                        subName: subjectData.name,
                        subCode: subjectData.code,
                        sessions: subjectData.sessions,
                        sclassName: guestClass._id,
                        school: guestAdmin._id
                    });
                    await guestSubject.save();
                    console.log(`✓ Created subject: ${subjectData.name} for ${guestClass.sclassName}`);
                }
                guestSubjects.push(guestSubject);
            }
        }

        // 4. Create Guest Teachers
        const teachers = [
            { name: 'Guest Teacher', email: 'tony@12', subject: 'Mathematics' },
            { name: 'Dr. Sarah Johnson', email: 'sarah@demo.com', subject: 'Physics' },
            { name: 'Prof. Michael Brown', email: 'michael@demo.com', subject: 'Chemistry' },
            { name: 'Ms. Emily Davis', email: 'emily@demo.com', subject: 'Biology' },
            { name: 'Mr. James Wilson', email: 'james@demo.com', subject: 'English' },
            { name: 'Dr. Lisa Anderson', email: 'lisa@demo.com', subject: 'Computer Science' }
        ];

        for (const teacherData of teachers) {
            let guestTeacher = await Teacher.findOne({ email: teacherData.email });
            if (!guestTeacher) {
                // Find a subject for this teacher
                const teacherSubject = guestSubjects.find(s => s.subName === teacherData.subject && !s.teacher);
                const teacherClass = guestClasses[0]; // Assign to first class

                guestTeacher = new Teacher({
                    name: teacherData.name,
                    email: teacherData.email,
                    password: hashedPassword,
                    role: 'Teacher',
                    school: guestAdmin._id,
                    teachSclass: teacherClass._id,
                    teachSubject: teacherSubject ? teacherSubject._id : null,
                    dateOfBirth: new Date('1985-01-01'),
                    gender: 'Male',
                    phone: '+1234567890',
                    address: '456 Teacher Lane, Demo City'
                });
                await guestTeacher.save();

                // Update subject with teacher
                if (teacherSubject) {
                    teacherSubject.teacher = guestTeacher._id;
                    await teacherSubject.save();
                }

                console.log(`✓ Created teacher: ${teacherData.name}`);
            }
        }

        // 5. Create Guest Students
        const students = [
            { name: 'Dipesh Awasthi', rollNum: '1' },
            { name: 'John Smith', rollNum: '2' },
            { name: 'Emma Johnson', rollNum: '3' },
            { name: 'Michael Brown', rollNum: '4' },
            { name: 'Sarah Davis', rollNum: '5' },
            { name: 'David Wilson', rollNum: '6' },
            { name: 'Lisa Anderson', rollNum: '7' },
            { name: 'James Taylor', rollNum: '8' },
            { name: 'Emily Martinez', rollNum: '9' },
            { name: 'Robert Garcia', rollNum: '10' }
        ];

        for (const studentData of students) {
            let guestStudent = await Student.findOne({ 
                rollNum: studentData.rollNum,
                school: guestAdmin._id 
            });
            
            if (!guestStudent) {
                guestStudent = new Student({
                    name: studentData.name,
                    rollNum: studentData.rollNum,
                    password: hashedPassword,
                    sclassName: guestClasses[0]._id, // Assign to first class
                    school: guestAdmin._id,
                    role: 'Student',
                    dateOfBirth: new Date('2005-01-01'),
                    gender: 'Male',
                    phone: '+1234567890',
                    address: '789 Student Street, Demo City',
                    emergencyContact: '+1234567891'
                });
                await guestStudent.save();
                console.log(`✓ Created student: ${studentData.name}`);
            }
        }

        // 6. Create Sample Notices
        const notices = [
            {
                title: 'Welcome to Demo School',
                details: 'Welcome to our demo school management system. Explore all the features available for students, teachers, and administrators.',
                date: new Date()
            },
            {
                title: 'Exam Schedule Released',
                details: 'The final examination schedule has been released. Please check your respective class timetables.',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            },
            {
                title: 'Holiday Notice',
                details: 'School will remain closed on national holidays. Regular classes will resume as per schedule.',
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
            }
        ];

        for (const noticeData of notices) {
            const existingNotice = await Notice.findOne({ 
                title: noticeData.title,
                school: guestAdmin._id 
            });
            
            if (!existingNotice) {
                const notice = new Notice({
                    ...noticeData,
                    school: guestAdmin._id
                });
                await notice.save();
                console.log(`✓ Created notice: ${noticeData.title}`);
            }
        }

        // 7. Create Sample Lectures
        const sampleLectures = [
            {
                title: 'Introduction to Algebra',
                description: 'Basic concepts of algebra including variables, equations, and problem-solving techniques.',
                lectureType: 'text',
                content: {
                    textContent: `# Introduction to Algebra

Algebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations.

## Key Concepts:
1. **Variables**: Letters that represent unknown numbers (x, y, z)
2. **Constants**: Fixed numbers (1, 2, 3, etc.)
3. **Expressions**: Combinations of variables and constants (2x + 3)
4. **Equations**: Mathematical statements showing equality (2x + 3 = 7)

## Basic Operations:
- Addition and Subtraction
- Multiplication and Division
- Solving for variables

## Example Problem:
Solve for x: 2x + 5 = 13
Step 1: Subtract 5 from both sides: 2x = 8
Step 2: Divide by 2: x = 4

Practice these concepts to build a strong foundation in algebra!`
                },
                difficulty: 'Beginner',
                estimatedDuration: 45,
                tags: ['algebra', 'mathematics', 'basics'],
                isPublished: true,
                publishedAt: new Date()
            },
            {
                title: 'Newton\'s Laws of Motion',
                description: 'Understanding the three fundamental laws that govern motion in physics.',
                lectureType: 'text',
                content: {
                    textContent: `# Newton's Laws of Motion

Sir Isaac Newton formulated three laws that describe the relationship between forces and motion.

## First Law (Law of Inertia):
An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

**Example**: A book on a table remains stationary until someone pushes it.

## Second Law (F = ma):
The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.

**Formula**: Force = Mass × Acceleration
**Example**: A heavier object requires more force to achieve the same acceleration.

## Third Law (Action-Reaction):
For every action, there is an equal and opposite reaction.

**Example**: When you walk, you push backward on the ground, and the ground pushes forward on you.

## Applications:
- Vehicle motion
- Rocket propulsion
- Sports activities
- Engineering design

These laws form the foundation of classical mechanics!`
                },
                difficulty: 'Intermediate',
                estimatedDuration: 50,
                tags: ['physics', 'motion', 'newton'],
                isPublished: true,
                publishedAt: new Date()
            },
            {
                title: 'Introduction to Programming',
                description: 'Basic programming concepts and problem-solving with computers.',
                lectureType: 'text',
                content: {
                    textContent: `# Introduction to Programming

Programming is the process of creating instructions for computers to solve problems and perform tasks.

## What is Programming?
Programming involves writing code using specific languages that computers can understand and execute.

## Key Concepts:
1. **Algorithm**: Step-by-step solution to a problem
2. **Variables**: Storage locations for data
3. **Functions**: Reusable blocks of code
4. **Loops**: Repetitive execution of code
5. **Conditions**: Decision-making in programs

## Popular Programming Languages:
- **Python**: Easy to learn, versatile
- **JavaScript**: Web development
- **Java**: Enterprise applications
- **C++**: System programming
- **HTML/CSS**: Web design

## Your First Program:
\`\`\`python
print("Hello, World!")
\`\`\`

## Problem-Solving Steps:
1. Understand the problem
2. Plan the solution
3. Write the code
4. Test and debug
5. Optimize if needed

Programming is like learning a new language - practice makes perfect!`
                },
                difficulty: 'Beginner',
                estimatedDuration: 60,
                tags: ['programming', 'computer science', 'basics'],
                isPublished: true,
                publishedAt: new Date()
            }
        ];

        // Find a teacher and subject for lectures
        const mathTeacher = await Teacher.findOne({ email: 'tony@12' });
        const mathSubject = await Subject.findOne({ subName: 'Mathematics', school: guestAdmin._id });
        const physicsSubject = await Subject.findOne({ subName: 'Physics', school: guestAdmin._id });
        const csSubject = await Subject.findOne({ subName: 'Computer Science', school: guestAdmin._id });

        const lectureSubjects = [mathSubject, physicsSubject, csSubject];

        for (let i = 0; i < sampleLectures.length; i++) {
            const lectureData = sampleLectures[i];
            const subject = lectureSubjects[i] || mathSubject;
            
            const existingLecture = await Lecture.findOne({ 
                title: lectureData.title,
                school: guestAdmin._id 
            });
            
            if (!existingLecture && mathTeacher && subject) {
                const lecture = new Lecture({
                    ...lectureData,
                    teacher: mathTeacher._id,
                    subject: subject._id,
                    sclass: guestClasses[0]._id,
                    school: guestAdmin._id
                });
                await lecture.save();
                console.log(`✓ Created lecture: ${lectureData.title}`);
            }
        }

        console.log('\n🎉 Guest mode setup completed successfully!');
        console.log('\n=== Guest Login Credentials ===');
        console.log('👨‍💼 Admin Login:');
        console.log('   Email: yogendra@12');
        console.log('   Password: zxc');
        console.log('\n👨‍🏫 Teacher Login:');
        console.log('   Email: tony@12');
        console.log('   Password: zxc');
        console.log('\n👨‍🎓 Student Login:');
        console.log('   Roll Number: 1');
        console.log('   Name: Dipesh Awasthi');
        console.log('   Password: zxc');
        console.log('\n📚 Features Available:');
        console.log('   • Complete dashboard for all roles');
        console.log('   • Student management');
        console.log('   • Teacher management');
        console.log('   • Class and subject management');
        console.log('   • Notice board');
        console.log('   • Complaint system');
        console.log('   • Chat system');
        console.log('   • Lecture system');
        console.log('   • Attendance tracking');
        console.log('   • Profile management');
        console.log('\n🚀 Ready to explore the demo!');

    } catch (error) {
        console.error('❌ Error setting up guest mode:', error);
        throw error;
    }
}

module.exports = setupGuestMode;

// Run if called directly
if (require.main === module) {
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');
    dotenv.config();

    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log('📡 Connected to MongoDB');
        return setupGuestMode();
    }).then(() => {
        console.log('✅ Setup completed');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
}