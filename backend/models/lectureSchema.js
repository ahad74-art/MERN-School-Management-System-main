const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teacher',
        required: true
    },
    sclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    lectureType: {
        type: String,
        enum: ['video', 'text', 'pdf', 'document'],
        required: true
    },
    // Content based on lecture type
    content: {
        // For text lectures
        textContent: {
            type: String,
            maxlength: 10000
        },
        // For file uploads (video/pdf/documents)
        fileName: {
            type: String
        },
        filePath: {
            type: String
        },
        fileSize: {
            type: Number
        },
        mimeType: {
            type: String
        },
        // For video lectures
        videoDuration: {
            type: Number, // in seconds
            default: 0
        },
        // For video thumbnail
        thumbnailPath: {
            type: String
        }
    },
    // Lecture metadata
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    estimatedDuration: {
        type: Number, // in minutes
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    // Analytics
    viewCount: {
        type: Number,
        default: 0
    },
    totalWatchTime: {
        type: Number, // in seconds
        default: 0
    },
    // Track which students have viewed this lecture
    viewedBy: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'student'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        },
        watchTime: {
            type: Number, // in seconds for videos
            default: 0
        },
        completed: {
            type: Boolean,
            default: false
        },
        progress: {
            type: Number, // percentage (0-100)
            default: 0
        }
    }],
    // Comments/Notes from students
    comments: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'student'
        },
        comment: {
            type: String,
            required: true,
            maxlength: 500
        },
        timestamp: {
            type: Number, // for video lectures - time in seconds
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { 
    timestamps: true 
});

// Indexes for better query performance
lectureSchema.index({ subject: 1, sclass: 1, teacher: 1 });
lectureSchema.index({ school: 1, isActive: 1, isPublished: 1 });
lectureSchema.index({ createdAt: -1 });
lectureSchema.index({ teacher: 1, createdAt: -1 });
lectureSchema.index({ sclass: 1, subject: 1, isPublished: 1 });

// Virtual for formatted file size
lectureSchema.virtual('formattedFileSize').get(function() {
    if (!this.content?.fileSize) return 'Unknown';
    
    const bytes = this.content.fileSize;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for formatted duration
lectureSchema.virtual('formattedDuration').get(function() {
    const duration = this.content?.videoDuration || this.estimatedDuration * 60;
    if (!duration) return null;
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
});

// Method to increment view count and track progress
lectureSchema.methods.trackView = function(studentId, watchTime = 0, progress = 0) {
    // Find existing view record
    const existingViewIndex = this.viewedBy.findIndex(view => 
        view.student.toString() === studentId.toString()
    );
    
    if (existingViewIndex !== -1) {
        // Update existing view record
        const existingView = this.viewedBy[existingViewIndex];
        if (watchTime > existingView.watchTime) {
            existingView.watchTime = watchTime;
            existingView.progress = progress;
            existingView.completed = progress >= 90; // Consider 90% as completed
            existingView.viewedAt = new Date();
        }
    } else {
        // Add new view record
        this.viewedBy.push({
            student: studentId,
            watchTime: watchTime,
            progress: progress,
            completed: progress >= 90,
            viewedAt: new Date()
        });
        this.viewCount += 1;
    }
    
    // Update total watch time
    this.totalWatchTime += watchTime;
    
    return this.save();
};

// Method to add comment
lectureSchema.methods.addComment = function(studentId, comment, timestamp = 0) {
    this.comments.push({
        student: studentId,
        comment: comment,
        timestamp: timestamp,
        createdAt: new Date()
    });
    
    return this.save();
};

// Static method to get lectures by class and subject
lectureSchema.statics.getLecturesByClassAndSubject = function(sclassId, subjectId, includeUnpublished = false) {
    const query = {
        sclass: sclassId,
        subject: subjectId,
        isActive: true
    };
    
    if (!includeUnpublished) {
        query.isPublished = true;
    }
    
    return this.find(query)
        .populate('teacher', 'name email')
        .populate('subject', 'subName subCode')
        .populate('sclass', 'sclassName')
        .sort({ createdAt: -1 });
};

// Static method to get teacher's lectures
lectureSchema.statics.getTeacherLectures = function(teacherId, includeUnpublished = true) {
    const query = {
        teacher: teacherId,
        isActive: true
    };
    
    if (!includeUnpublished) {
        query.isPublished = true;
    }
    
    return this.find(query)
        .populate('subject', 'subName subCode')
        .populate('sclass', 'sclassName')
        .sort({ createdAt: -1 });
};

// Static method to get student's accessible lectures
lectureSchema.statics.getStudentLectures = function(studentId, sclassId) {
    return this.find({
        sclass: sclassId,
        isActive: true,
        isPublished: true
    })
    .populate('teacher', 'name email')
    .populate('subject', 'subName subCode')
    .populate('sclass', 'sclassName')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('lecture', lectureSchema);