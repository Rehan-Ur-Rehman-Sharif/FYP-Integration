import {
  Calendar,
  QrCode,
  CheckCircle
} from "lucide-react";
// import heroImage from "../../assets/final_image.png";
import heroBg from "../../assets/attendence.png";
import { Link } from "react-router-dom";


import { Zap } from "lucide-react";
const Hero = () => {
  const activity = [
    "Student checked in",
    "Employee checked in",
    "Guest registered",
  ];

  return (
   
    <section
  className="hero"
  style={{
    backgroundImage: `url(${heroBg})`,
    backgroundSize: "105%", 
           // 👈 zoom out
    backgroundPosition: "right center",
    backgroundRepeat: "no-repeat",
  }}
>
      <div className="hero-left">
        <span className="tag">
<Zap size={24} color="#2C5F9E" /> Smart Attendance Management</span>

        <h1>
          Modern Attendance <br />
          <span>Made Simple</span>
        </h1>

        <p>
          Transform your organization's attendance tracking with our
          comprehensive SaaS platform. QR-based check-ins, real-time analytics,
          and seamless event management—all in one place.
        </p>

        <div className="hero-buttons">
         <Link to="/login" className="btn-primary">
  Start Free Trial
</Link>
          <button className="btn-secondary">Watch Demo</button>
        </div>

        <div className="mini-stats">
          <span><h2 className="head">500+</h2>Organizations</span>
          <span><h2 className="head">50K+</h2>Users</span>
          <span><h2 className="head"> 99.9%</h2>Uptime</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;