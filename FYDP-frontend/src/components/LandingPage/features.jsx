import {
  QrCode,
  BarChart3,
  Users,
  Calendar,
  Shield,
  FileText
} from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "QR Code Check-ins",
      desc: "Fast and contactless attendance marking with dynamic QR codes for enhanced security",
      icon: <QrCode size={28} />,
    },
    {
      title: "Real-time Analytics",
      desc: "Comprehensive dashboards with live data, trends, and insights at your fingertips",
      icon: <BarChart3 size={28} />,
    },
    {
      title: "Multi-Role Management",
      desc: "7 user roles including students, teachers, admins, and event participants",
      icon: <Users size={28} />,
    },
    {
      title: "Event Management",
      desc: "Create and manage events with registration links and attendance tracking",
      icon: <Calendar size={28} />,
    },
    {
      title: "Enterprise Security",
      desc: "Bank-level encryption with organization-aware data isolation and access controls",
      icon: <Shield size={28} />,
    },
    {
      title: "Automated Reports",
      desc: "Generate detailed reports with customizable filters and export options",
      icon: <FileText size={28} />,
    },
  ];

  return (
    <section className="features">
      <h2>Everything You Need to Manage Attendance</h2>

      <p className="subtitle">
        Powerful features designed for educational institutions, corporate offices, and event organizers
      </p>

      <div className="feature-grid">
        {features.map((item, i) => (
          <div key={i} className="feature-card">
            <div className="icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;