// Dummy data for Participant dashboard

const participants = [
  {
    id: "par-001",
    profile: {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "9876543210",
    },
    upcomingEvents: [
      {
        id: "evt-010",
        title: "Cybersecurity Summit 2026",
        venue: "Lecture Hall B2",
        date: "04/20/2026",
        description:
          "Deep dive into modern cybersecurity threats and defense strategies for enterprises.",
        attended: null,
      },
    ],
    pastEvents: [
      {
        id: "evt-001",
        title: "Tech Conference 2024",
        venue: "Main Auditorium, Building A",
        date: "11/25/2024",
        description:
          "Annual technology conference featuring industry leaders and innovative solutions.",
        attended: true,
      },
      {
        id: "evt-002",
        title: "Workshop on AI & ML",
        venue: "Computer Lab 301",
        date: "12/1/2024",
        description:
          "Hands-on workshop covering fundamentals and advanced topics in AI and Machine Learning.",
        attended: false,
      },
    ],
  },
  {
    id: "par-002",
    profile: {
      name: "Carlos Rivera",
      email: "carlos.rivera@email.com",
      phone: "9123456789",
    },
    upcomingEvents: [
      {
        id: "evt-003",
        title: "Cybersecurity Summit 2025",
        venue: "Lecture Hall B2",
        date: "04/15/2025",
        description:
          "Deep dive into modern cybersecurity threats and defense strategies for enterprises.",
        attended: null,
      },
    ],
    pastEvents: [
      {
        id: "evt-001",
        title: "Tech Conference 2024",
        venue: "Main Auditorium, Building A",
        date: "11/25/2024",
        description:
          "Annual technology conference featuring industry leaders and innovative solutions.",
        attended: true,
      },
      {
        id: "evt-004",
        title: "Cloud Computing Bootcamp",
        venue: "Computer Lab 205",
        date: "10/10/2024",
        description:
          "Intensive bootcamp covering AWS, Azure, and Google Cloud fundamentals.",
        attended: false,
      },
      {
        id: "evt-005",
        title: "Open Source Hackathon",
        venue: "Innovation Hub, Floor 3",
        date: "09/05/2024",
        description:
          "24-hour hackathon encouraging contributions to open source projects.",
        attended: true,
      },
    ],
  },
  {
    id: "par-003",
    profile: {
      name: "Amina Yusuf",
      email: "amina.yusuf@email.com",
      phone: "9988776655",
    },
    upcomingEvents: [
      {
        id: "evt-006",
        title: "Data Science Symposium",
        venue: "Seminar Room A1",
        date: "05/22/2025",
        description:
          "Annual symposium on emerging trends in data science and big data analytics.",
        attended: null,
      },
      {
        id: "evt-007",
        title: "Robotics Expo 2025",
        venue: "Science Block, Ground Floor",
        date: "06/10/2025",
        description:
          "Exhibition showcasing cutting-edge robotics projects from universities worldwide.",
        attended: null,
      },
    ],
    pastEvents: [
      {
        id: "evt-002",
        title: "Workshop on AI & ML",
        venue: "Computer Lab 301",
        date: "12/1/2024",
        description:
          "Hands-on workshop covering fundamentals and advanced topics in AI and Machine Learning.",
        attended: true,
      },
    ],
  },
];

export default participants;
