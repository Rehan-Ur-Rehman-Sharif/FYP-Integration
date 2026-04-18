import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="cta">
      <div className="cta-card">
        <h2>Ready to Transform Your Attendance Management?</h2>

        <p>
          Join hundreds of organizations already using TrustMark to streamline
          their operations
        </p>

        <div className="cta-buttons">
             <Link to="/login" className="btnn-primary">
  Start Free Trial <ArrowRight size={18} />
</Link>
          {/* <button className="btnn-primary">
            Start Free Trial <ArrowRight size={18} />
          </button> */}

          <button className="btnn-outline">
            Schedule a Demo
          </button>
        </div>

        <span className="cta-note">
          No credit card required • 14-day free trial • Cancel anytime
        </span>
      </div>
    </section>
  );
};

export default CTA;