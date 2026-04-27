export const calculateSubjectAttendancePercentage = (presentCount, totalSessions) => {
    if (totalSessions === 0 || presentCount === 0) {
        return 0;
    }
    const percentage = (presentCount / totalSessions) * 100;
    return percentage.toFixed(2); // Limit to two decimal places
};


export const groupAttendanceBySubject = (subjectAttendance) => {
    const attendanceBySubject = {};

    if (!subjectAttendance || !Array.isArray(subjectAttendance)) {
        console.log('❌ Invalid attendance data:', subjectAttendance);
        return attendanceBySubject;
    }

    subjectAttendance.forEach((attendance, index) => {
        // Check if attendance record is valid
        if (!attendance) {
            console.log(`❌ Attendance record ${index} is null/undefined`);
            return;
        }

        // Check if subName exists and is populated
        if (!attendance.subName) {
            console.log(`❌ Attendance record ${index}: subName is null/undefined`);
            return;
        }

        // Check if subName is populated (not just an ObjectId string)
        if (typeof attendance.subName === 'string') {
            console.log(`❌ Attendance record ${index}: subName is not populated (ObjectId: ${attendance.subName})`);
            return;
        }

        // Check if required fields exist
        if (!attendance.subName.subName) {
            console.log(`❌ Attendance record ${index}: subName.subName is missing`);
            return;
        }

        const subName = attendance.subName.subName;
        const sessions = attendance.subName.sessions || 0;
        const subId = attendance.subName._id;

        if (!attendanceBySubject[subName]) {
            attendanceBySubject[subName] = {
                present: 0,
                absent: 0,
                sessions: sessions,
                allData: [],
                subId: subId
            };
        }
        if (attendance.status === "Present") {
            attendanceBySubject[subName].present++;
        } else if (attendance.status === "Absent") {
            attendanceBySubject[subName].absent++;
        }
        attendanceBySubject[subName].allData.push({
            date: attendance.date,
            status: attendance.status,
        });
    });
    return attendanceBySubject;
}

export const calculateOverallAttendancePercentage = (subjectAttendance) => {
    if (!subjectAttendance || !Array.isArray(subjectAttendance) || subjectAttendance.length === 0) {
        return 0;
    }

    let totalSessionsSum = 0;
    let presentCountSum = 0;
    const uniqueSubIds = [];

    subjectAttendance.forEach((attendance) => {
        // Check if attendance and subName are valid
        if (!attendance || !attendance.subName || typeof attendance.subName === 'string') {
            return;
        }

        const subId = attendance.subName._id;
        if (!uniqueSubIds.includes(subId)) {
            const sessions = parseInt(attendance.subName.sessions) || 0;
            totalSessionsSum += sessions;
            uniqueSubIds.push(subId);
        }
        presentCountSum += attendance.status === "Present" ? 1 : 0;
    });

    if (totalSessionsSum === 0) {
        return 0;
    }

    return (presentCountSum / totalSessionsSum) * 100;
};