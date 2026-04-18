import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Principal, Lincoln High School",
      text: "TrustMark has revolutionized how we track attendance. The QR code system is incredibly fast and our staff loves how easy it is to use.",
    },
    {
      name: "James Chen",
      role: "HR Director, Tech Corp",
      text: "We've saved countless hours on attendance management. The analytics help us identify patterns and improve workplace engagement.",
    },
    {
      name: "Maria Rodriguez",
      role: "Event Coordinator",
      text: "Managing large conferences is now a breeze. The participant registration and check-in features are outstanding!",
    },
  ];

  return (
    <section className="testimonials">
      <h2>Trusted by Leading Organizations</h2>

      <p className="subtitle">
        See what our customers have to say
      </p>

      <div className="testimonial-grid">
        {testimonials.map((item, i) => (
          <div key={i} className="testimonial-card">
            
            {/* ⭐ Stars */}
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill="#facc15" stroke="none" />
              ))}
            </div>

            {/* 💬 Quote */}
            <p className="testimonial-text">
              "{item.text}"
            </p>

            {/* 👤 User */}
            <div className="user">
              <div className="avatar"></div>

              <div>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </div>

            {/* Quote icon */}
            <Quote className="quote-icon" size={40} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;