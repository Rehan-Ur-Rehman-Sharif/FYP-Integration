import { Link } from "react-router-dom";
import logo from "../../assets/footer.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-brand">
           {/* <div className="w-full bg-white h-18 shadow-md flex items-center justify-between px-4"> */}
                {/* Logo */}
                <div>
                <img
                  src={logo}
                  alt="TrustMark Logo"
                  className="w-40 h-27 object-contain cursor-pointer "
                /></div>
          <p>Modern attendance management for the digital age</p>
        </div>

        {/* PRODUCT */}
        <div className="footer-col">
          <h4>Product</h4>
          <ul>
            <li><Link to="#">Features</Link></li>
            <li><Link to="#">Pricing</Link></li>
            <li><Link to="#">Security</Link></li>
            <li><Link to="#">Integrations</Link></li>
          </ul>
        </div>

        {/* COMPANY */}
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="#">About Us</Link></li>
            <li><Link to="#">Careers</Link></li>
            <li><Link to="#">Blog</Link></li>
            <li><Link to="#">Contact</Link></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            <li><Link to="#">Help Center</Link></li>
            <li><Link to="#">Documentation</Link></li>
            <li><Link to="#">API Reference</Link></li>
            <li><Link to="#">Status</Link></li>
          </ul>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <span>© 2026 TrustMark. All rights reserved.</span>

        <div className="footer-links">
          <Link to="#">Privacy Policy</Link>
          <Link to="#">Terms of Service</Link>
          <Link to="#">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;