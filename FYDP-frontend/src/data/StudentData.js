// Example dataset containing multiple students.
// In a real app you'd fetch this from a backend and not store plain passwords.
const students = [
  {
    profile: {
      name: "John Smith",
      studentId: "2023001",
      year: "2023",
      section: "A",
      department: "Computer Science"
    },
    email: "john.smith@example.com",
    // plaintext password only for demo/testing — replace with real auth in production
    password: "password123",
    overallAttendance: {
      percentage: 83.6,
      status: "Good"
    },
    courses: [
      { code: "CS101", name: "Introduction to Programming", attendance: 85, present: 34, total: 40 },
      { code: "CS102", name: "Data Structures", attendance: 78, present: 31, total: 40 },
      { code: "MATH201", name: "Calculus II", attendance: 92, present: 37, total: 40 },
      { code: "ENG101", name: "Technical Writing", attendance: 88, present: 35, total: 40 },
      { code: "PHY101", name: "Physics I", attendance: 75, present: 30, total: 40 }
    ]
  },
  {
    profile: {
      name: "Aisha Khan",
      studentId: "2023002",
      year: "2024",
      section: "B",
      department: "Computer Science"
    },
    email: "aisha.khan@example.com",
    password: "aisha2023",
    overallAttendance: {
      percentage: 91.2,
      status: "Excellent"
    },
    courses: [
      { code: "CS101", name: "Introduction to Programming", attendance: 95, present: 38, total: 40 },
      { code: "CS102", name: "Data Structures", attendance: 89, present: 36, total: 40 },
      { code: "MATH201", name: "Calculus II", attendance: 94, present: 38, total: 40 },
      { code: "ENG101", name: "Technical Writing", attendance: 90, present: 36, total: 40 },
      { code: "PHY101", name: "Physics I", attendance: 86, present: 34, total: 40 }
    ]
  },
  {
    profile: {
      name: "Imran Ali",
      studentId: "2023003",
      year: "2022",
      section: "A",
      department: "BSCS"
    },
    email: "imran.ali@example.com",
    password: "imran_pw",
    overallAttendance: {
      percentage: 76.4,
      status: "Average"
    },
    courses: [
      { code: "EE101", name: "Circuit Analysis", attendance: 80, present: 32, total: 40 },
      { code: "MATH101", name: "Calculus I", attendance: 72, present: 29, total: 40 },
      { code: "CS301", name: "Database Management Systems", attendance: 72, present: 29, total: 40 }
    
    ]
  }
];

export default students;
