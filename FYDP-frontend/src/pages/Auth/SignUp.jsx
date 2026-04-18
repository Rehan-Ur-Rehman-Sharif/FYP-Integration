import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Building2, CalendarDays, User } from "lucide-react";
import "./Signup.css";
import signupImage from "../../assets/signup.png"; // your PNG image

const Signup = () => {
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    society: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async () => {
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (role === "admin") {
      if (!form.organization) {
        setError("Please enter the organization name.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const payload = {
        Management_name: form.organization,
        email: form.email,
        password: form.password,
        password2: form.confirmPassword,
      };

      try {
        setLoading(true);
        await axios.post("/api/auth/register/management/", payload);

        alert("Organization Admin registered successfully!");
        navigate("/login");
      } catch (err) {
        const result = err.response?.data;
        if (result) {
          const messages = Object.values(result).flat().join(" ");
          setError(messages || "Registration failed. Please try again.");
        } else {
          setError("Network error. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Existing localStorage logic for other roles
    const newUser = {
      role,
      ...form,
      createdAt: new Date().toISOString(),
    };

    const key =
      role === "eventAdmin" ? "eventAdmins" : "participants";

    const existing = JSON.parse(localStorage.getItem(key)) || [];
    existing.push(newUser);
    localStorage.setItem(key, JSON.stringify(existing));

    alert("Signup successful!");
  };

  return (
    <div className="signup-page">
      <div className="signup-container">

        {/* LEFT SIDE ROLE MENU */}
        <div className="signup-sidebar">
          <br></br>
          <h3>Sign up</h3>
          <button
            className={role === "admin" ? "role active" : "role"}
            onClick={() => setRole("admin")}
          >
            <Building2 size={20} className="role-icon" /> Organization Admin
          </button>

          <button
            className={role === "eventAdmin" ? "role active" : "role"}
            onClick={() => setRole("eventAdmin")}
          >
            <CalendarDays size={20} className="role-icon" /> Event Admin
          </button>

          <button
            className={role === "participant" ? "role active" : "role"}
            onClick={() => setRole("participant")}
          >
             <User size={20} className="role-icon" /> Participant
          </button>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="signup-form-area">

          <div className="form-section">
            <h2>
              {role === "admin" && "Sign up as Organization Admin"}
              {role === "eventAdmin" && "Sign up as Event Admin"}
              {role === "participant" && "Sign up as Participant"}
            </h2>

           <p className="login-link">
          Already have an account?{" "}
        <Link to="/login" className="login-link-text">
          Login here
        </Link>
        </p>

            {/* ROLE SPECIFIC FIELDS */}

            {role === "admin" && (
              <input
                name="organization"
                placeholder="Organization Name"
                value={form.organization}
                onChange={handleChange}
              />
            )}

            {role === "eventAdmin" && (
              <input
                name="society"
                placeholder="Society Name"
                value={form.society}
                onChange={handleChange}
              />
            )}

            {role === "participant" && (
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
              />
            )}

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />

            {role === "admin" && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            )}

            {error && <p className="error-msg">{error}</p>}

            <button className="submit-btn" onClick={handleSignup} disabled={loading}>
              {loading ? "Registering..." : "Submit"}
            </button>
          </div>

          {/* IMAGE SIDE */}
          <div className="signup-image">
            <img src={signupImage} alt="signup illustration" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;