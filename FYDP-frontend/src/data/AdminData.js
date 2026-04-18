// src/data/AdminData.js

const adminData = {
  // ✅ Admin profile for login (SOURCE OF TRUTH)
  profile: {
    adminId: "ADMIN001",
    name: "System Admin",
    email: "admin@uni.edu",
    password: "admin123",
    department: "Computer Science"
  },

  years: ["2021", "2022", "2023", "2024"],
  batches: ["2021", "2022", "2023", "2024"],
  programs: ["CS", "SE", "CYS", "DS"],
  departments: ["Computer Science"],

  courses: [
    { code: "CS301", name: "Database Management Systems" },
    { code: "CS401", name: "Distributed Systems" },
    { code: "CS501", name: "Advanced Algorithms" }
  ],

  studentAttendanceRecords: {
    CS301: [
      { roll: "2023001", name: "Rahul Sharma", batch: "2023", program: "CSIT", total: 30, attended: 28, percent: 93.3 }
    ]
  },

  attendanceRequests: [
    {
      id: "req1",
      teacher: "Prof. Sharma",
      studentName: "Amit Kumar",
      studentRoll: "2023045",
      batch: "2023",
      program: "CSIT",
      date: "2024-11-10",
      slots: 2,
      course: "CS301 - Database Management Systems",
      reason: "Student was absent due to illness"
    }
  ],

  students: [
    { roll: "2023001", name: "Rahul Sharma", year: "2023", batch: "2023", program: "CSIT", total: 45, attended: 42 },
    { roll: "2023002", name: "Priya Patel", year: "2023", batch: "2023", program: "CSIT", total: 30, attended: 25 }
  ],

  teachers: [
    { id: "T001", name: "Prof. Sharma", email: "sharma@uni.edu", dept: "Computer Science", courses: ["CS301", "CS401"] },
    { id: "T002", name: "Dr. Verma", email: "verma@uni.edu", dept: "Computer Science", courses: ["CS501"] }
  ]
};

export default adminData;
