const Lecture = require('../models/lectureSchema.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/lectures/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow video, pdf, and document files
    const allowedTypes = [
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only videos, PDFs, and documents are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

// Create a new lecture
const lectureCreate = async (req, res) => {
    try {
        const {
            title,
            description,
            subject,
            teacher,
            sclass,
            school,
            lectureType,
            textContent,
            difficulty,
            estimatedDuration,
            tags,
            isPublished
        } = req.body;

        // Validate required fields
        if (!title || !description || !subject || !teacher || !sclass || !school || !lectureType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const lectureData = {
            title,
            description,
            subject,
            teacher,
            sclass,
            school,
            lectureType,
            difficulty: difficulty || 'Beginner',
            estimatedDuration: estimatedDuration || 0,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            isPublished: isPublished === 'true' || isPublished === true,
            publishedAt: (isPublished === 'true' || isPublished === true) ? new Date() : null,
            content: {}
        };

        // Handle different lecture types
        if (lectureType === 'text') {
            if (!textContent) {
                return res.status(400).json({ message: 'Text content is required for text lectures' });
            }
            lectureData.content.textContent = textContent;
        } else if (req.file) {
            // Handle file upload
            lectureData.content.fileName = req.file.originalname;
            lectureData.content.filePath = req.file.path;
            lectureData.content.fileSize = req.file.size;
            lectureData.content.mimeType = req.file.mimetype;
        } else if (lectureType !== 'text') {
            return res.status(400).json({ message: 'File is required for non-text lectures' });
        }

        const newLecture = new Lecture(lectureData);
        const savedLecture = await newLecture.save();

        // Populate the saved lecture
        const populatedLecture = await Lecture.findById(savedLecture._id)
            .populate('teacher', 'name email')
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('school', 'schoolName');

        res.status(201).json(populatedLecture);
    } catch (err) {
        console.error('Error creating lecture:', err);
        
        // Handle validation errors specifically
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: validationErrors,
                error: err.message 
            });
        }
        
        res.status(500).json({ message: 'Error creating lecture', error: err.message });
    }
};

// Get all lectures for a teacher
const getTeacherLectures = async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        const includeUnpublished = req.query.includeUnpublished !== 'false';

        const lectures = await Lecture.getTeacherLectures(teacherId, includeUnpublished);
        
        if (lectures.length > 0) {
            res.json(lectures);
        } else {
            res.json({ message: "No lectures found" });
        }
    } catch (err) {
        console.error('Error fetching teacher lectures:', err);
        res.status(500).json({ message: 'Error fetching lectures', error: err.message });
    }
};

// Get lectures for a student (by class)
const getStudentLectures = async (req, res) => {
    try {
        const { studentId, sclassId } = req.params;
        const subjectId = req.query.subject;

        let query = {
            sclass: sclassId,
            isActive: true,
            isPublished: true
        };

        if (subjectId) {
            query.subject = subjectId;
        }

        const lectures = await Lecture.find(query)
            .populate('teacher', 'name email')
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .sort({ createdAt: -1 });

        if (lectures.length > 0) {
            res.json(lectures);
        } else {
            res.json({ message: "No lectures found" });
        }
    } catch (err) {
        console.error('Error fetching student lectures:', err);
        res.status(500).json({ message: 'Error fetching lectures', error: err.message });
    }
};

// Get lectures by class and subject
const getLecturesByClassAndSubject = async (req, res) => {
    try {
        const { sclassId, subjectId } = req.params;
        const includeUnpublished = req.query.includeUnpublished === 'true';

        const lectures = await Lecture.getLecturesByClassAndSubject(sclassId, subjectId, includeUnpublished);
        
        if (lectures.length > 0) {
            res.json(lectures);
        } else {
            res.json({ message: "No lectures found" });
        }
    } catch (err) {
        console.error('Error fetching lectures by class and subject:', err);
        res.status(500).json({ message: 'Error fetching lectures', error: err.message });
    }
};

// Get single lecture details
const getLectureDetail = async (req, res) => {
    try {
        const lectureId = req.params.id;
        
        const lecture = await Lecture.findById(lectureId)
            .populate('teacher', 'name email')
            .populate('subject', 'subName subCode')
            .populate('sclass', 'sclassName')
            .populate('school', 'schoolName')
            .populate('comments.student', 'name rollNum')
            .populate('viewedBy.student', 'name rollNum');

        if (lecture) {
            res.json(lecture);
        } else {
            res.status(404).json({ message: "Lecture not found" });
        }
    } catch (err) {
        console.error('Error fetching lecture detail:', err);
        res.status(500).json({ message: 'Error fetching lecture', error: err.message });
    }
};

// Update lecture
const updateLecture = async (req, res) => {
    try {
        const lectureId = req.params.id;
        const updateData = { ...req.body };

        // Handle tags
        if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
        }

        // Handle publish status
        if (updateData.isPublished === 'true' || updateData.isPublished === true) {
            updateData.isPublished = true;
            if (!updateData.publishedAt) {
                updateData.publishedAt = new Date();
            }
        } else if (updateData.isPublished === 'false' || updateData.isPublished === false) {
            updateData.isPublished = false;
            updateData.publishedAt = null;
        }

        // Handle file upload if present
        if (req.file) {
            updateData['content.fileName'] = req.file.originalname;
            updateData['content.filePath'] = req.file.path;
            updateData['content.fileSize'] = req.file.size;
            updateData['content.mimeType'] = req.file.mimetype;
        }

        // Handle text content
        if (updateData.textContent) {
            updateData['content.textContent'] = updateData.textContent;
            delete updateData.textContent;
        }

        const updatedLecture = await Lecture.findByIdAndUpdate(
            lectureId,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('teacher', 'name email')
        .populate('subject', 'subName subCode')
        .populate('sclass', 'sclassName');

        if (updatedLecture) {
            res.json(updatedLecture);
        } else {
            res.status(404).json({ message: "Lecture not found" });
        }
    } catch (err) {
        console.error('Error updating lecture:', err);
        res.status(500).json({ message: 'Error updating lecture', error: err.message });
    }
};

// Delete lecture
const deleteLecture = async (req, res) => {
    try {
        const lectureId = req.params.id;
        
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        // Delete associated file if exists
        if (lecture.content?.filePath && fs.existsSync(lecture.content.filePath)) {
            fs.unlinkSync(lecture.content.filePath);
        }

        await Lecture.findByIdAndDelete(lectureId);
        res.json({ message: "Lecture deleted successfully" });
    } catch (err) {
        console.error('Error deleting lecture:', err);
        res.status(500).json({ message: 'Error deleting lecture', error: err.message });
    }
};

// Track lecture view/progress
const trackLectureView = async (req, res) => {
    try {
        const { lectureId, studentId, watchTime, progress } = req.body;

        if (!lectureId || !studentId) {
            return res.status(400).json({ message: 'Lecture ID and Student ID are required' });
        }

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        await lecture.trackView(studentId, watchTime || 0, progress || 0);
        res.json({ message: "View tracked successfully" });
    } catch (err) {
        console.error('Error tracking lecture view:', err);
        res.status(500).json({ message: 'Error tracking view', error: err.message });
    }
};

// Add comment to lecture
const addLectureComment = async (req, res) => {
    try {
        const { lectureId, studentId, comment, timestamp } = req.body;

        if (!lectureId || !studentId || !comment) {
            return res.status(400).json({ message: 'Lecture ID, Student ID, and comment are required' });
        }

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        await lecture.addComment(studentId, comment, timestamp || 0);
        
        // Return updated lecture with populated comments
        const updatedLecture = await Lecture.findById(lectureId)
            .populate('comments.student', 'name rollNum');
        
        res.json(updatedLecture.comments);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Error adding comment', error: err.message });
    }
};

// Get lecture analytics for teacher
const getLectureAnalytics = async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        
        const lectures = await Lecture.find({ teacher: teacherId, isActive: true })
            .select('title viewCount totalWatchTime viewedBy createdAt')
            .populate('viewedBy.student', 'name rollNum');

        const analytics = {
            totalLectures: lectures.length,
            totalViews: lectures.reduce((sum, lecture) => sum + lecture.viewCount, 0),
            totalWatchTime: lectures.reduce((sum, lecture) => sum + lecture.totalWatchTime, 0),
            lectureStats: lectures.map(lecture => ({
                id: lecture._id,
                title: lecture.title,
                views: lecture.viewCount,
                watchTime: lecture.totalWatchTime,
                completionRate: lecture.viewedBy.length > 0 
                    ? (lecture.viewedBy.filter(view => view.completed).length / lecture.viewedBy.length * 100).toFixed(1)
                    : 0,
                createdAt: lecture.createdAt
            }))
        };

        res.json(analytics);
    } catch (err) {
        console.error('Error fetching analytics:', err);
        res.status(500).json({ message: 'Error fetching analytics', error: err.message });
    }
};

// Serve lecture files
const serveLectureFile = async (req, res) => {
    try {
        const lectureId = req.params.id;
        
        const lecture = await Lecture.findById(lectureId);
        if (!lecture || !lecture.content?.filePath) {
            return res.status(404).json({ message: "File not found" });
        }

        const filePath = lecture.content.filePath;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found on server" });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', lecture.content.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${lecture.content.fileName}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (err) {
        console.error('Error serving file:', err);
        res.status(500).json({ message: 'Error serving file', error: err.message });
    }
};

module.exports = {
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
};