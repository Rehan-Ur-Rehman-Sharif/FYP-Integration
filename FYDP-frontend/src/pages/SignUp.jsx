import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { registerManagement, registerParticipant } from "../api/auth";

const Signup = () => {
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    department: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async () => {
    if (!role) { setError("Please select a role"); return; }
    if (!form.name || !form.email || !form.password) { setError("Please fill all required fields"); return; }
    if (form.password !== form.password2) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError("");
    try {
      if (role === "admin") {
        await registerManagement({
          Management_name: form.name,
          email: form.email,
          password: form.password,
          password2: form.password2,
          department: form.department,
          role: "university_admin",
        });
      } else if (role === "eventAdmin") {
        await registerManagement({
          Management_name: form.name,
          email: form.email,
          password: form.password,
          password2: form.password2,
          role: "event_admin",
        });
      } else if (role === "participant") {
        await registerParticipant({
          name: form.name,
          email: form.email,
          password: form.password,
          password2: form.password2,
          phone: form.phone,
        });
      }
      alert(`${role} registered successfully! Please log in.`);
      navigate("/login");
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData
        ? Object.values(errData).flat().join(" ")
        : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Signup</h2>

        {error && (
          <div style={{ color: "red", marginBottom: 10, fontSize: 14 }}>{error}</div>
        )}

        {/* ROLE SELECTION */}
        <label>Select Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Choose role</option>
          <option value="admin">University Admin</option>
          <option value="eventAdmin">Event Admin</option>
          <option value="participant">Participant</option>
        </select>

        {/* COMMON FIELDS */}
        {role && (
          <>
            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
            <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
            <input name="password2" type="password" placeholder="Confirm Password" value={form.password2} onChange={handleChange} />
          </>
        )}

        {/* UNIVERSITY ADMIN */}
        {role === "admin" && (
          <input name="department" placeholder="Department" value={form.department} onChange={handleChange} />
        )}

        {/* PARTICIPANT */}
        {(role === "participant" || role === "eventAdmin") && (
          <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
        )}

        {role && (
          <button className="primary" onClick={handleSignup} disabled={loading}>
            {loading ? "Signing up…" : "Signup"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Signup;

