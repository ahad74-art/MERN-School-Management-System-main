import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Lecture API functions
export const lectureAPI = {
    // Create a new lecture
    createLecture: async (lectureData) => {
        const formData = new FormData();
        
        // Append all text fields
        Object.keys(lectureData).forEach(key => {
            if (key !== 'lectureFile' && lectureData[key] !== null && lectureData[key] !== undefined) {
                formData.append(key, lectureData[key]);
            }
        });
        
        // Append file if exists
        if (lectureData.lectureFile) {
            formData.append('lectureFile', lectureData.lectureFile);
        }
        
        const response = await api.post('/LectureCreate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get lectures for teacher
    getTeacherLectures: async (teacherId, includeUnpublished = true) => {
        const response = await api.get(`/TeacherLectures/${teacherId}?includeUnpublished=${includeUnpublished}`);
        return response.data;
    },

    // Get lectures for student
    getStudentLectures: async (studentId, sclassId, subjectId = null) => {
        let url = `/StudentLectures/${studentId}/${sclassId}`;
        if (subjectId) {
            url += `?subject=${subjectId}`;
        }
        const response = await api.get(url);
        return response.data;
    },

    // Get lectures by class and subject
    getLecturesByClassAndSubject: async (sclassId, subjectId, includeUnpublished = false) => {
        const response = await api.get(`/ClassSubjectLectures/${sclassId}/${subjectId}?includeUnpublished=${includeUnpublished}`);
        return response.data;
    },

    // Get single lecture details
    getLectureDetail: async (lectureId) => {
        const response = await api.get(`/Lecture/${lectureId}`);
        return response.data;
    },

    // Update lecture
    updateLecture: async (lectureId, lectureData) => {
        const formData = new FormData();
        
        // Append all text fields
        Object.keys(lectureData).forEach(key => {
            if (key !== 'lectureFile' && lectureData[key] !== null && lectureData[key] !== undefined) {
                formData.append(key, lectureData[key]);
            }
        });
        
        // Append file if exists
        if (lectureData.lectureFile) {
            formData.append('lectureFile', lectureData.lectureFile);
        }
        
        const response = await api.put(`/Lecture/${lectureId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete lecture
    deleteLecture: async (lectureId) => {
        const response = await api.delete(`/Lecture/${lectureId}`);
        return response.data;
    },

    // Track lecture view/progress
    trackLectureView: async (lectureId, studentId, watchTime = 0, progress = 0) => {
        const response = await api.post('/LectureView', {
            lectureId,
            studentId,
            watchTime,
            progress
        });
        return response.data;
    },

    // Add comment to lecture
    addLectureComment: async (lectureId, studentId, comment, timestamp = 0) => {
        const response = await api.post('/LectureComment', {
            lectureId,
            studentId,
            comment,
            timestamp
        });
        return response.data;
    },

    // Get lecture analytics for teacher
    getLectureAnalytics: async (teacherId) => {
        const response = await api.get(`/LectureAnalytics/${teacherId}`);
        return response.data;
    },

    // Get lecture file URL
    getLectureFileUrl: (lectureId) => {
        return `${API_BASE_URL}/LectureFile/${lectureId}`;
    }
};

export default lectureAPI;