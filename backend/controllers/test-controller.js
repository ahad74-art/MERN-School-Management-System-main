const Test = require('../models/testSchema');
const Student = require('../models/studentSchema');

// Create a new test
const createTest = async (req, res) => {
    try {
        const test = new Test(req.body);
        const result = await test.save();
        res.status(201).json({ success: true, test: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all tests for a teacher
const getTeacherTests = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const tests = await Test.find({ teacher: teacherId })
            .populate('subject', 'subName')
            .populate('sclass', 'sclassName')
            .sort({ testDate: -1 });
        
        res.json({ success: true, tests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get test details
const getTestDetail = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findById(testId)
            .populate('subject', 'subName')
            .populate('sclass', 'sclassName')
            .populate('teacher', 'name')
            .populate('results.student', 'name rollNum');
        
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        
        res.json({ success: true, test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update test
const updateTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findByIdAndUpdate(
            testId,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        
        res.json({ success: true, test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark test as completed
const markTestCompleted = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findByIdAndUpdate(
            testId,
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        );
        
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        
        res.json({ success: true, message: 'Test marked as completed', test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add/Update student marks
const updateStudentMarks = async (req, res) => {
    try {
        const { testId } = req.params;
        const { studentId, marksObtained, status, remarks } = req.body;
        
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        
        // Check if student result already exists
        const existingResultIndex = test.results.findIndex(
            r => r.student.toString() === studentId
        );
        
        if (existingResultIndex > -1) {
            // Update existing result
            test.results[existingResultIndex] = {
                student: studentId,
                marksObtained,
                status,
                remarks
            };
        } else {
            // Add new result
            test.results.push({
                student: studentId,
                marksObtained,
                status,
                remarks
            });
        }
        
        await test.save();
        res.json({ success: true, message: 'Marks updated successfully', test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete test
const deleteTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findByIdAndDelete(testId);
        
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        
        res.json({ success: true, message: 'Test deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get test statistics for teacher
const getTestStats = async (req, res) => {
    try {
        const { teacherId } = req.params;
        
        const totalTests = await Test.countDocuments({ teacher: teacherId });
        const completedTests = await Test.countDocuments({ 
            teacher: teacherId, 
            status: 'completed' 
        });
        const scheduledTests = await Test.countDocuments({ 
            teacher: teacherId, 
            status: 'scheduled' 
        });
        const inProgressTests = await Test.countDocuments({ 
            teacher: teacherId, 
            status: 'in-progress' 
        });
        
        res.json({
            success: true,
            stats: {
                totalTests,
                completedTests,
                scheduledTests,
                inProgressTests
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get students for a test (from class)
const getTestStudents = async (req, res) => {
    try {
        const { testId } = req.params;
        const test = await Test.findById(testId);
        
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        
        const students = await Student.find({ sclassName: test.sclass })
            .select('name rollNum');
        
        res.json({ success: true, students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTest,
    getTeacherTests,
    getTestDetail,
    updateTest,
    markTestCompleted,
    updateStudentMarks,
    deleteTest,
    getTestStats,
    getTestStudents
};
