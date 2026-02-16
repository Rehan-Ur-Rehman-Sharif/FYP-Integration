const teacherData = [
  {
    profile: {
      name: "Dr. Anjali Verma",
      teacherId: "T2021042",
      department: "Computer Science",
      avatar: "👩‍🏫",
      coursesTeaching: ["CS301", "CS401", "CS501"],
      email: "anjali.verma@example.com",
      password: "anjali2023"
    },

    batches: ["2022", "2024"],
    programs: ["BSCS", "BSIT", "BSSE"],
    attendanceTypes: ["Lecture", "Lab"],

    courses: [
      { code: "CS301", name: "Database Management Systems" },
      { code: "CS401", name: "Distributed Systems" },
      { code: "CS501", name: "Advanced Algorithms" }
    ],
  },

  // ✅ SECOND TEACHER
  {
    profile: {
      name: "Mr. Ahmed Khan",
      teacherId: "T2023055",
      department: "Information Technology",
      avatar: "👨‍🏫",
      coursesTeaching: ["IT201", "IT305"],
      email: "ahmed.khan@example.com",
      password: "ahmed2023"
    },

    batches: ["2023", "2024"],
    programs: ["BSIT", "BSCS"],
    attendanceTypes: ["Lecture", "Lab"],

    courses: [
      { code: "IT201", name: "Introduction to IT" },
      { code: "IT305", name: "Web Technologies" }
    ],
  },
];

export default teacherData;
