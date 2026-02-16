// src/data/events.js
const events = [
  {
    id: "evt-001",
    title: "Tech Conference 2024",
    venue: "Main Auditorium, Building A",
    date: "2024-11-25",
    regStart: "2024-11-01",
    regEnd: "2024-11-20",
    description:
      "Annual technology conference featuring industry leaders and innovative solutions.",
    registeredCount: 2,
    participants: [
      { id: "p1", name: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210", age: 22 },
      { id: "p2", name: "Priya Patel", email: "priya@example.com", phone: "9876543211", age: 21 }
    ],
    attendance: [
      { id: "p1", status: "present", time: "10:02 AM" },
      { id: "p2", status: "present", time: "10:05 AM" }
    ],
    qrImage: "/mnt/data/b05d9fb1-ce8a-4eb6-9e96-80f02d00d93f.png", // sample QR image (uploaded)
    registrationLink: "https://example.com/events/evt-001/register"
  },
  {
    id: "evt-002",
    title: "Workshop on AI & ML",
    venue: "Computer Lab 301",
    date: "2024-12-01",
    regStart: "2024-11-10",
    regEnd: "2024-11-28",
    description:
      "Hands-on workshop covering fundamentals and advanced topics in AI and Machine Learning.",
    registeredCount: 1,
    participants: [
      { id: "p3", name: "Karan Mehta", email: "karan@example.com", phone: "9876543222", age: 24 }
    ],
    attendance: [
      { id: "p3", status: "present", time: "09:55 AM" }
    ],
    qrImage: "/mnt/data/b05d9fb1-ce8a-4eb6-9e96-80f02d00d93f.png",
    registrationLink: "https://example.com/events/evt-002/register"
  }
];

export default events;
