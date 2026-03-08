const backendDomain='http://localhost:8080'

const summaryApi={
    signUp:{
        url: `${backendDomain}/api/signup`,
        method: "post"
    },
    login:{
        url: `${backendDomain}/api/login`,
        method: "post"
    },
    currentUser:{
        url: `${backendDomain}/api/user-details`,
        method: "get"
    },
    userLogout:{
        url: `${backendDomain}/api/user-logout`,
        method: "get"
    },
    // Admin dashboard – student/teacher list with server-side filtering
    students:{
        url: `${backendDomain}/api/students/`,
        method: "get"
    },
    teachers:{
        url: `${backendDomain}/api/teachers/`,
        method: "get"
    },
    // Attendance summary endpoints for admin View Attendance tab
    studentAttendance:{
        url: `${backendDomain}/api/attendance/student/`,
        method: "get"
    },
    courseAttendance:{
        url: `${backendDomain}/api/attendance/course/`,
        method: "get"
    }
}

export default summaryApi