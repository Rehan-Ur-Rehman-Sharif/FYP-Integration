import { CheckCircle, GraduationCap, Building2, Calendar, Landmark } from "lucide-react";

const Stats = () => {
  const benefits = [
    "Reduce manual attendance tracking by 90%",
    "Save 10+ hours per week on administrative tasks",
    "Improve attendance accuracy to 99.9%",
    "Access data from anywhere, anytime",
    "Seamless integration with existing systems",
    "24/7 customer support and training",
  ];

  const stats = [
    { value: "200+", label: "Educational Institutions", icon: <GraduationCap size={26} /> },
    { value: "150+", label: "Corporate Offices", icon: <Building2 size={26} /> },
    { value: "100+", label: "Event Organizers", icon: <Calendar size={26} /> },
    { value: "50+", label: "Government Agencies", icon: <Landmark size={26} /> },
  ];

  return (
    <section className="stats">
      <div className="stats-left">
        <h2>Built for Organizations of All Sizes</h2>

        <p>
          Whether you're managing a small team or a multi-campus organization,
          TrustMark scales with your needs.
        </p>

        <ul>
          {benefits.map((item, i) => (
            <li key={i}>
              <CheckCircle size={18} /> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="stats-grid">
        {stats.map((item, i) => (
          <div key={i} className="stat-box">
            <div className="stat-icon">{item.icon}</div>
            <h3>{item.value}</h3>
            <p>{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;