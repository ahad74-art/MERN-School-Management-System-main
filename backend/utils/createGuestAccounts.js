const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load models
const Admin = require('../models/adminSchema');
const Teacher = require('../models/teacherSchema');
const Student = require('../models/studentSchema');
const Sclass = require('../models/sclassSchema');
const Subject = require('../models/subjectSchema');
const Notice = require('../models/noticeSchema');
const Complain = require('../models/complainSchema');
const Lecture = require('../models/lectureSchema');

// Load environment variables
dotenv.config();

async function createGuestAccounts() {
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

        // 1. Create Guest Admin Account
        console.log('Creating Guest Admin Account...');
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
            console.log('Guest Admin created:', guestAdmin._id);
        } else {
            console.log('Guest Admin already exists:', guestAdmin._id);
        }

        // 2. Create Demo Class
        console.log('Creating Demo Class...');
        let demoClass = await Sclass.findOne({ sclassName: 'Demo Class 10A', school: guestAdmin._id });
        if (!demoClass) {
            demoClass = new Sclass({
                sclassName: 'Demo Class 10A',
                school: guestAdmin._id
            });
            demoClass = await demoClass.save();
            console.log('Demo Class created:', demoClass._id);
        } else {
            console.log('Demo Class already exists:', demoClass._id);
        }

        // 3. Create Demo Subjects
        console.log('Creating Demo Subjects...');
        const subjectNames = [
            { name: 'Mathematics', code: 'MATH101', sessions: 40 },
            { name: 'Physics', code: 'PHY101', sessions: 35 },
            { name: 'Chemistry', code: 'CHEM101', sessions: 35 },
            { name: 'English', code: 'ENG101', sessions: 30 },
            { name: 'Computer Science', code: 'CS101', sessions: 45 }
        ];

        const createdSubjects = [];
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
                    sessions: subjectData.sessions,
                    sclassName: demoClass._id,
                    school: guestAdmin._id
                });
                subject = await subject.save();
                console.log(`Subject ${subjectData.name} created:`, subject._id);
            } else {
                console.log(`Subject ${subjectData.name} already exists:`, subject._id);
            }
            createdSubjects.push(subject);
        }

        // 4. Create Guest Teacher Account
        console.log('Creating Guest Teacher Account...');
        let guestTeacher = await Teacher.findOne({ email: 'tony@12' });
        if (!guestTeacher) {
            guestTeacher = new Teacher({
                name: 'Tony Stark',
                email: 'tony@12',
                password: hashedPassword,
                role: 'Teacher',
                school: guestAdmin._id,
                teachSubject: createdSubjects[0]._id, // Assign Mathematics
                teachSclass: demoClass._id,
                dateOfBirth: new Date('1980-05-15'),
                gender: 'Male',
                phone: '+1-555-0123',
                address: '123 Demo Street, Demo City, DC 12345',
                emergencyContact: '+1-555-0124'
            });
            guestTeacher = await guestTeacher.save();
            
            // Update subject with teacher
            await Subject.findByIdAndUpdate(createdSubjects[0]._id, { teacher: guestTeacher._id });
            console.log('Guest Teacher created:', guestTeacher._id);
        } else {
            console.log('Guest Teacher already exists:', guestTeacher._id);
        }

        // 5. Create Guest Student Account
        console.log('Creating Guest Student Account...');
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
                emergencyContact: '+1-555-0126',
                email: 'dipesh.student@demo.com',
                // Add sample exam results
                examResult: createdSubjects.map(subject => ({
                    subName: subject._id,
                    marksObtained: Math.floor(Math.random() * 40) + 60 // Random marks between 60-100
                })),
                // Add sample attendance
                attendance: createdSubjects.map(subject => ({
                    subName: subject._id,
                    status: 'Present',
                    date: new Date()
                }))
            });
            guestStudent = await guestStudent.save();
            console.log('Guest Student created:', guestStudent._id);
        } else {
            console.log('Guest Student already exists:', guestStudent._id);
        }

        // 6. Create Sample Notices
        console.log('Creating Sample Notices...');
        const notices = [
            {
                title: 'Welcome to Demo School',
                details: 'Welcome to our comprehensive school management system demo. Explore all features including student management, teacher tools, and administrative functions.',
                date: new Date(),
                school: guestAdmin._id
            },
            {
                title: 'New Lecture Module Available',
                details: 'Teachers can now upload video lectures, PDFs, and text content. Students can view lectures, track progress, and add comments.',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                school: guestAdmin._id
            },
            {
                title: 'Chat System Implemented',
                details: 'Real-time messaging between students and teachers is now available. Use the Messages section to communicate.',
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
                console.log(`Notice "${noticeData.title}" created`);
            }
        }

        // 7. Create Sample Complaints
        console.log('Creating Sample Complaints...');
        const complaints = [
            {
                user: guestStudent._id,
                complaint: 'The library needs more computer science books for reference.',
                school: guestAdmin._id,
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                status: 'Pending'
            },
            {
                user: guestStudent._id,
                complaint: 'Request for additional practice sessions in Mathematics.',
                school: guestAdmin._id,
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'Resolved'
            }
        ];

        for (const complainData of complaints) {
            const existingComplain = await Complain.findOne({ 
                complaint: complainData.complaint, 
                school: guestAdmin._id 
            });
            
            if (!existingComplain) {
                const complain = new Complain(complainData);
                await complain.save();
                console.log(`Complaint created: "${complainData.complaint.substring(0, 30)}..."`);
            }
        }

        // 8. Create Sample Lectures
        console.log('Creating Sample Lectures...');
        const lectures = [
            {
                title: 'Introduction to Algebra',
                description: 'Basic concepts of algebra including variables, equations, and problem-solving techniques.',
                subject: createdSubjects[0]._id, // Mathematics
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
4. **Equations**: Mathematical statements showing equality (2x + 3 = 7)

## Basic Rules:
- Addition: x + y = y + x
- Multiplication: x × y = y × x
- Distribution: a(b + c) = ab + ac

## Practice Problems:
1. Solve for x: 2x + 5 = 13
2. Simplify: 3(x + 4) - 2x
3. Find x when: x² - 4 = 0

Remember: Practice makes perfect in algebra!`
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
                subject: createdSubjects[1]._id, // Physics
                teacher: guestTeacher._id,
                sclass: demoClass._id,
                school: guestAdmin._id,
                lectureType: 'text',
                content: {
                    textContent: `# Newton's Laws of Motion

## First Law (Law of Inertia)
An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

**Example**: A book on a table remains stationary until someone pushes it.

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
1. Car safety (seatbelts and airbags)
2. Rocket propulsion
3. Sports (jumping, throwing)

## Practice Questions:
1. Calculate the force needed to accelerate a 10kg object at 5m/s²
2. Explain why passengers lurch forward when a car suddenly stops
3. How do rockets work in space where there's no air to push against?`
                },
                difficulty: 'Intermediate',
                estimatedDuration: 50,
                tags: ['physics', 'motion', 'newton', 'laws'],
                isPublished: true,
                publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                viewCount: 12,
                comments: [{
                    student: guestStudent._id,
                    comment: 'Great explanation! The examples really help understand the concepts.',
                    timestamp: 0,
                    createdAt: new Date()
                }]
            },
            {
                title: 'Introduction to Programming',
                description: 'Basic programming concepts and problem-solving with computers.',
                subject: createdSubjects[4]._id, // Computer Science
                teacher: guestTeacher._id,
                sclass: demoClass._id,
                school: guestAdmin._id,
                lectureType: 'text',
                content: {
                    textContent: `# Introduction to Programming

## What is Programming?
Programming is the process of creating instructions for computers to solve problems and perform tasks.

## Key Concepts:

### 1. Algorithm
A step-by-step procedure to solve a problem.

### 2. Variables
Storage locations with names that hold data.
\`\`\`
name = "John"
age = 16
score = 95.5
\`\`\`

### 3. Control Structures
- **Sequence**: Instructions executed one after another
- **Selection**: Making decisions (if-else)
- **Iteration**: Repeating actions (loops)

### 4. Functions
Reusable blocks of code that perform specific tasks.

## Example: Simple Calculator
\`\`\`python
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

# Using the functions
result1 = add(5, 3)      # Result: 8
result2 = subtract(10, 4) # Result: 6
\`\`\`

## Problem-Solving Steps:
1. **Understand** the problem
2. **Plan** the solution
3. **Code** the solution
4. **Test** and debug
5. **Document** your code

## Practice Exercise:
Write a program to calculate the area of a rectangle given length and width.

Programming is like learning a new language - practice regularly and start with simple problems!`
                },
                difficulty: 'Beginner',
                estimatedDuration: 60,
                tags: ['programming', 'computer science', 'basics', 'algorithms'],
                isPublished: true,
                publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                viewCount: 8
            }
        ];

        for (const lectureData of lectures) {
            const existingLecture = await Lecture.findOne({ 
                title: lectureData.title, 
                school: guestAdmin._id 
            });
            
            if (!existingLecture) {
                const lecture = new Lecture(lectureData);
                await lecture.save();
                console.log(`Lecture "${lectureData.title}" created`);
            }
        }

        console.log('\n✅ Guest accounts and sample data created successfully!');
        console.log('\n📋 Guest Login Credentials:');
        console.log('Admin: yogendra@12 / zxc');
        console.log('Teacher: tony@12 / zxc');
        console.log('Student: Roll Number: 1, Name: Dipesh Awasthi, Password: zxc');
        console.log('\n🎯 Features Available:');
        console.log('- Complete user management');
        console.log('- Real-time chat system');
        console.log('- Lecture management with sample content');
        console.log('- Notice board with announcements');
        console.log('- Complaint system');
        console.log('- Attendance tracking');
        console.log('- Grade management');
        console.log('- Profile editing');
        console.log('- Analytics and reporting');

        await mongoose.disconnect();
        console.log('\nDatabase connection closed.');
        
    } catch (error) {
        console.error('Error creating guest accounts:', error);
        process.exit(1);
    }
}

// Run the function if this file is executed directly
if (require.main === module) {
    createGuestAccounts();
}

module.exports = createGuestAccounts;