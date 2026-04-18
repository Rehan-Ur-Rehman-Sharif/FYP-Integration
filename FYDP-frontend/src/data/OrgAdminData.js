// Main Organizational Admin Dashboard Data

const orgAdminData = {
  overview: {
    totalAdmins: 4,
    activeAdmins: 3,
    eventAdmins: 3,
    participants: 3,
    students: 4,
    teachers: 3,
    pendingMeetings: 2
  },

admins: [
  {
    id: 1,
    name: "ABC University",
    email: "admin@abc.edu",
    rfid: ["RF1001", "RF1002", "RF1003", "RF1004"],
    status: "active"
  },
  {
    id: 2,
    name: "XYZ College",
    email: "admin@xyz.edu",
    rfid: ["RF2001", "RF2002"],
    status: "active"
  },
  {
    id: 3,
    name: "Global Institute",
    email: "admin@global.edu",
    rfid: ["RF3001", "RF3002", "RF3003"],
    status: "inactive"
  },
  {
    id: 4,
    name: "Tech University",
    email: "admin@tech.edu",
    rfid: ["RF4001", "RF4002", "RF4003", "RF4004", "RF4005"],
    status: "active"
  }
],

  eventAdmins: [
    {
      id: 1,
      name: "Event Coordinator 1",
      email: "events1@university.edu",
      organization: "ABC University",
      eventsManaged: 12,
      activeEvents: 3,
      status: "active",
      joinDate: "2023-02-10"
    },
    {
      id: 2,
      name: "Event Coordinator 2",
      email: "events2@college.edu",
      organization: "XYZ College",
      eventsManaged: 8,
      activeEvents: 2,
      status: "active",
      joinDate: "2023-04-15"
    },
    {
      id: 3,
      name: "Event Coordinator 3",
      email: "events3@university.edu",
      organization: "ABC University",
      eventsManaged: 5,
      activeEvents: 0,
      status: "inactive",
      joinDate: "2023-07-20"
    }
  ],

  meetings: [
    {
      id: 1,
      email: "rajesh@university.edu",
      role: "Admin",
      purpose: "Budget Discussion",
       organization: "ABC University",
      department: "Computer Science",
      date: "2024-01-28",
      time: "10:00 AM",
      status: "pending"
    },
    {
      id: 2,
      email: "anita@university.edu",
      role: "Admin",
      purpose: "New Course Approval",
      organization: "ABC University",
      department: "Electronics",
      date: "2024-01-29",
      time: "2:00 PM",
      status: "rejected"
    },
    {
      id: 3,
      email: "vijay@university.edu",
      role: "Teacher",
      purpose: "Equipment Request",
      organization: "ABC University",
      department: "Civil",
      date: "2024-01-27",
      time: "11:00 AM",
      status: "approved"
    }
  ],

 payments: [
  {
    id: 1,
    organization: "ABC University",
    email: "finance@abc.edu",
    role: "Admin",
    amount: 25000,
    dueDate: "2024-01-30",
    status: "Paid",
  },
  {
    id: 2,
    organization: "XYZ University",
    email: "accounts@xyz.edu",
    role: "Manager",
    amount: 5000,
    dueDate: "2024-01-20",
    status: "Overdue",
  },
  {
    id: 3,
    organization: "Global Institute",
    email: "billing@global.edu",
    role: "Coordinator",
    amount: 12000,
    dueDate: "2024-02-05",
    status: "Pending",
  },
  {
    id: 4,
    organization: "Tech College",
    email: "admin@techcollege.edu",
    role: "Admin",
    amount: 18000,
    dueDate: "2024-01-25",
    status: "Paid",
  }
],

  users: [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@student.edu",
      role: "Student",
      organization: "ABC University",
      department: "CS",
      status: "online"
    },
    {
      id: 2,
      name: "Dr. Rajesh Kumar",
      email: "rajesh@university.edu",
      role: "Admin",
      organization: "ABC University",
      department: "CS",
      status: "online"
    },
    {
      id: 3,
      name: "Event Coordinator",
      email: "events@university.edu",
      role: "Event Admin",
      organization: "ABC University",
      department: "Admin",
      status: "offline"
    }
  ]
};

export default orgAdminData;
