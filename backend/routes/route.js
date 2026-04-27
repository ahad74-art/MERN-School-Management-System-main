const router = require('express').Router();

// const { adminRegister, adminLogIn, deleteAdmin, getAdminDetail, updateAdmin } = require('../controllers/admin-controller.js');

const { adminRegister, adminLogIn, getAdminDetail, updateAdmin} = require('../controllers/admin-controller.js');
const { forgetPassword, getUserForReset, verifyUpdate, forgotPassword, verifyOtp, resetPassword, resetPasswordByToken, validateResetToken } = require('../controllers/auth-controller.js');
const { 
    getOrCreateChat, 
    getUserChats, 
    sendMessage, 
    getChatMessages, 
    markMessagesAsRead, 
    getAvailableTeachers, 
    getTeacherStudents, 
    deleteMessage 
} = require('../controllers/chat-controller.js');

const { sclassCreate, sclassList, deleteSclass, deleteSclasses, getSclassDetail, getSclassStudents } = require('../controllers/class-controller.js');
const { complainCreate, complainList, updateComplainStatus, assignComplain, deleteComplain, getComplainStats } = require('../controllers/complain-controller.js');
const { noticeCreate, noticeList, deleteNotices, deleteNotice, updateNotice } = require('../controllers/notice-controller.js');
const {
    studentRegister,
    studentLogIn,
    getStudents,
    getStudentDetail,
    deleteStudents,
    deleteStudent,
    updateStudent,
    studentAttendance,
    deleteStudentsByClass,
    updateExamResult,
    clearAllStudentsAttendanceBySubject,
    clearAllStudentsAttendance,
    removeStudentAttendanceBySubject,
    removeStudentAttendance } = require('../controllers/student_controller.js');
const { subjectCreate, classSubjects, deleteSubjectsByClass, getSubjectDetail, deleteSubject, freeSubjectList, allSubjects, deleteSubjects } = require('../controllers/subject-controller.js');
const { teacherRegister, teacherLogIn, getTeachers, getTeacherDetail, updateTeacher, deleteTeachers, deleteTeachersByClass, deleteTeacher, updateTeacherSubject, addTeacherClass, removeTeacherClass, teacherAttendance } = require('../controllers/teacher-controller.js');
const {
    createTest,
    getTeacherTests,
    getTestDetail,
    updateTest,
    markTestCompleted,
    updateStudentMarks,
    deleteTest,
    getTestStats,
    getTestStudents
} = require('../controllers/test-controller.js');
const { 
    upload, 
    lectureCreate, 
    getTeacherLectures, 
    getStudentLectures, 
    getLecturesByClassAndSubject, 
    getLectureDetail, 
    updateLecture, 
    deleteLecture, 
    trackLectureView, 
    addLectureComment, 
    getLectureAnalytics, 
    serveLectureFile 
} = require('../controllers/lecture-controller.js');
const { createGuestAccounts, checkGuestAccounts } = require('../controllers/guest-controller.js');
const {
    createCheckoutSession,
    handleStripeWebhook,
    verifyCheckoutSession,
    createPaymentIntent,
    verifyPayment,
    getStudentFeeDetails,
    getPaymentHistory,
    generatePaymentReceipt,
    handleWebhook
} = require('../controllers/payment-controller.js');
const {
    createFeeStructure,
    getFeeStructures,
    updateFeeStructure,
    deleteFeeStructure,
    getAllPayments,
    getPendingFees,
    markFeeAsPaid,
    getPaymentAnalytics,
    exportPaymentData,
    testFeeCreation,
    completeDemoPayment
} = require('../controllers/fee-controller.js');

// Import fee services
const feeReminderService = require('../services/feeReminderService.js');
const lateFeeService = require('../services/lateFeeService.js');

// Admin
router.post('/AdminReg', adminRegister);
router.post('/AdminLogin', adminLogIn);

router.get("/Admin/:id", getAdminDetail)

router.put("/Admin/:id", updateAdmin)

// Authentication - OTP-based forgot password (3-step flow)
router.post('/forgot-password', forgotPassword);       // Step 1: send OTP
router.post('/verify-otp', verifyOtp);                 // Step 2: verify OTP
router.post('/reset-password', resetPassword);         // Step 3: set new password
// Legacy token-based reset
router.post('/reset-password/:token', resetPasswordByToken);
router.get('/reset-password/validate/:token', validateResetToken);
router.post('/forgetPassword', forgetPassword);
router.get('/getUserForReset', getUserForReset);
router.get('/verifyUpdate/:role/:id', verifyUpdate);

// Student

router.post('/StudentReg', studentRegister);
router.post('/StudentLogin', studentLogIn)

router.get("/Students/:id", getStudents)
router.get("/Student/:id", getStudentDetail)

router.delete("/Students/:id", deleteStudents)
router.delete("/StudentsClass/:id", deleteStudentsByClass)
router.delete("/Student/:id", deleteStudent)

router.put("/Student/:id", updateStudent)

router.put('/UpdateExamResult/:id', updateExamResult)

router.put('/StudentAttendance/:id', studentAttendance)

router.put('/RemoveAllStudentsSubAtten/:id', clearAllStudentsAttendanceBySubject);
router.put('/RemoveAllStudentsAtten/:id', clearAllStudentsAttendance);

router.put('/RemoveStudentSubAtten/:id', removeStudentAttendanceBySubject);
router.put('/RemoveStudentAtten/:id', removeStudentAttendance)

// Teacher

router.post('/TeacherReg', teacherRegister);
router.post('/TeacherLogin', teacherLogIn)

router.get("/Teachers/:id", getTeachers)
router.get("/Teacher/:id", getTeacherDetail)

router.delete("/Teachers/:id", deleteTeachers)
router.delete("/TeachersClass/:id", deleteTeachersByClass)
router.delete("/Teacher/:id", deleteTeacher)

router.put("/Teacher/:id", updateTeacher)

router.put("/TeacherSubject", updateTeacherSubject)

router.put("/TeacherAddClass", addTeacherClass)
router.put("/TeacherRemoveClass", removeTeacherClass)

router.post('/TeacherAttendance/:id', teacherAttendance)

// Test System Routes

// Create a new test
router.post('/TestCreate', createTest);

// Get all tests for a teacher
router.get('/TeacherTests/:teacherId', getTeacherTests);

// Get test details
router.get('/Test/:testId', getTestDetail);

// Update test
router.put('/Test/:testId', updateTest);

// Mark test as completed
router.put('/TestComplete/:testId', markTestCompleted);

// Add/Update student marks
router.put('/TestMarks/:testId', updateStudentMarks);

// Delete test
router.delete('/Test/:testId', deleteTest);

// Get test statistics for teacher
router.get('/TestStats/:teacherId', getTestStats);

// Get students for a test
router.get('/TestStudents/:testId', getTestStudents);

// Get tests for a student's class
router.get('/ClassTests/:sclassId', async (req, res) => {
    try {
        const Test = require('../models/testSchema');
        const tests = await Test.find({ sclass: req.params.sclassId })
            .populate('subject', 'subName')
            .populate('sclass', 'sclassName')
            .populate('teacher', 'name')
            .sort({ testDate: -1 });
        res.json({ success: true, tests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Notice

router.post('/NoticeCreate', noticeCreate);

router.get('/NoticeList/:id', noticeList);

router.delete("/Notices/:id", deleteNotices)
router.delete("/Notice/:id", deleteNotice)

router.put("/Notice/:id", updateNotice)

// Complain

router.post('/ComplainCreate', complainCreate);

router.get('/ComplainList/:id', complainList);
router.put('/ComplainStatus/:id', updateComplainStatus);
router.put('/ComplainAssign/:id', assignComplain);
router.delete('/Complain/:id', deleteComplain);
router.get('/ComplainStats/:id', getComplainStats);

// Sclass

router.post('/SclassCreate', sclassCreate);

router.get('/SclassList/:id', sclassList);
router.get("/Sclass/:id", getSclassDetail)

router.get("/Sclass/Students/:id", getSclassStudents)

router.delete("/Sclasses/:id", deleteSclasses)
router.delete("/Sclass/:id", deleteSclass)

// Subject

router.post('/SubjectCreate', subjectCreate);

router.get('/AllSubjects/:id', allSubjects);
router.get('/ClassSubjects/:id', classSubjects);
router.get('/FreeSubjectList/:id', freeSubjectList);
router.get("/Subject/:id", getSubjectDetail)

router.delete("/Subject/:id", deleteSubject)
router.delete("/Subjects/:id", deleteSubjects)
router.delete("/SubjectsClass/:id", deleteSubjectsByClass)

// Chat System

// Get or create a chat between student and teacher
router.post('/ChatCreate', getOrCreateChat);

// Get all chats for a user
router.get('/UserChats/:userId/:userRole', getUserChats);

// Send a message
router.post('/MessageSend', sendMessage);

// Get messages for a chat
router.get('/ChatMessages/:chatId', getChatMessages);

// Mark messages as read
router.put('/MessagesRead', markMessagesAsRead);

// Get available teachers for student
router.get('/AvailableTeachers/:studentId', getAvailableTeachers);

// Get students for teacher
router.get('/TeacherStudents/:teacherId', getTeacherStudents);

// Delete a message
router.delete('/MessageDelete', deleteMessage);

// Lecture System

// Create a new lecture (with file upload)
router.post('/LectureCreate', upload.single('lectureFile'), lectureCreate);

// Get lectures for teacher
router.get('/TeacherLectures/:teacherId', getTeacherLectures);

// Get lectures for student
router.get('/StudentLectures/:studentId/:sclassId', getStudentLectures);

// Get lectures by class and subject
router.get('/ClassSubjectLectures/:sclassId/:subjectId', getLecturesByClassAndSubject);

// Get single lecture details
router.get('/Lecture/:id', getLectureDetail);

// Update lecture (with optional file upload)
router.put('/Lecture/:id', upload.single('lectureFile'), updateLecture);

// Delete lecture
router.delete('/Lecture/:id', deleteLecture);

// Track lecture view/progress
router.post('/LectureView', trackLectureView);

// Add comment to lecture
router.post('/LectureComment', addLectureComment);

// Get lecture analytics for teacher
router.get('/LectureAnalytics/:teacherId', getLectureAnalytics);

// Serve lecture files
router.get('/LectureFile/:id', serveLectureFile);

// Guest Account Management
router.post('/CreateGuestAccounts', createGuestAccounts);
router.get('/CheckGuestAccounts', checkGuestAccounts);

// Payment System Routes

// ── Stripe Checkout (redirect-based) ──
router.post('/payment/create-checkout-session', createCheckoutSession);
router.get('/payment/verify-session', verifyCheckoutSession);
// Stripe webhook — raw body required (handled in index.js before json middleware)
router.post('/webhook/stripe', handleStripeWebhook);

// Student Payment Routes
router.post('/payment/create-intent', createPaymentIntent);
router.post('/payment/verify', verifyPayment);
router.post('/payment/demo-complete', completeDemoPayment);
router.get('/payment/student/:studentId/fees', getStudentFeeDetails);
router.get('/payment/student/:studentId/history', getPaymentHistory);
router.get('/payment/receipt/:paymentId', generatePaymentReceipt);

// Admin Fee Management Routes
router.post('/fee/structure', createFeeStructure);
router.get('/fee/structures/:schoolId', getFeeStructures);
router.put('/fee/structure/:feeStructureId', updateFeeStructure);
router.delete('/fee/structure/:feeStructureId', deleteFeeStructure);

// Test route
router.get('/fee/test', testFeeCreation);

// Admin Payment Management Routes
router.get('/payment/school/:schoolId/all', getAllPayments);
router.get('/payment/school/:schoolId/pending', getPendingFees);
router.post('/payment/manual/:studentFeeId', markFeeAsPaid);
router.get('/payment/school/:schoolId/analytics', getPaymentAnalytics);
router.get('/payment/school/:schoolId/export', exportPaymentData);

// Payment Gateway Webhooks
router.post('/webhook/payment/:gateway', handleWebhook);

// Fee Services Routes
router.post('/fee/reminders/due-soon', async (req, res) => {
    const result = await feeReminderService.sendDueSoonReminders();
    res.json(result);
});

router.post('/fee/reminders/overdue', async (req, res) => {
    const result = await feeReminderService.sendOverdueReminders();
    res.json(result);
});

router.post('/fee/reminders/final-notice', async (req, res) => {
    const result = await feeReminderService.sendFinalNoticeReminders();
    res.json(result);
});

router.post('/fee/reminders/all', async (req, res) => {
    const result = await feeReminderService.runAllReminders();
    res.json(result);
});

router.get('/fee/reminders/stats/:schoolId', async (req, res) => {
    const { schoolId } = req.params;
    const { dateFrom, dateTo } = req.query;
    const result = await feeReminderService.getReminderStats(schoolId, dateFrom, dateTo);
    res.json(result);
});

router.post('/fee/late-fees/calculate', async (req, res) => {
    const result = await lateFeeService.calculateAndApplyLateFees();
    res.json(result);
});

router.get('/fee/late-fees/stats/:schoolId', async (req, res) => {
    const { schoolId } = req.params;
    const { academicYear } = req.query;
    const result = await lateFeeService.getLateFeeStats(schoolId, academicYear);
    res.json(result);
});

router.post('/fee/late-fees/waive/:studentFeeId', async (req, res) => {
    const { studentFeeId } = req.params;
    const { reason, approvedBy } = req.body;
    const result = await lateFeeService.waiveLateFee(studentFeeId, reason, approvedBy);
    res.json(result);
});

router.get('/fee/late-fees/waiver-eligible/:schoolId', async (req, res) => {
    const { schoolId } = req.params;
    const criteria = req.query;
    const result = await lateFeeService.getLateFeeWaiverEligible(schoolId, criteria);
    res.json(result);
});

module.exports = router;