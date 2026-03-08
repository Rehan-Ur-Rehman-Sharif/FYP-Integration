import React, { useState } from "react";
import "../styles/auth.css";
import summaryApi from "../common/index";

const Signup = () => {
  const [role, setRole] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    department: "",
    eventName: "",
    phone: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    if (!role) {
      alert("Please select a role");
      return;
    }

    if (!form.name || !form.email || !form.password) {
      alert("Please fill required fields");
      return;
    }

    // Map frontend roles to backend roles
    const backendRole =
      role === "admin" ? "admin" :
      role === "eventAdmin" ? "management" :
      "student"; // participant -> student (closest match)

    // ── Try backend API ──────────────────────────────────────────────
    try {
      const response = await fetch(summaryApi.signUp.url, {
        method: summaryApi.signUp.method.toUpperCase(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: backendRole,
          name: form.name,
          email: form.email,
          password: form.password,
          university: form.university,
          department: form.department,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(`Signup failed: ${err.error || response.statusText}`);
        return;
      }
    } catch (_) {
      // API unreachable – fall through to localStorage only
    }

    // ── Always persist locally (offline support / static dev) ────────
    const newUser = {
      role,
      ...form,
      createdAt: new Date().toISOString()
    };

    const key =
      role === "admin"
        ? "admins"
        : role === "eventAdmin"
        ? "eventAdmins"
        : "participants";

    const existing = JSON.parse(localStorage.getItem(key)) || [];
    existing.push(newUser);
    localStorage.setItem(key, JSON.stringify(existing));

    // save logged-in user
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        role,
        name: form.name,
        email: form.email
      })
    );

    alert(`${role} signup successful`);
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Signup</h2>

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
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </>
        )}

        {/* UNIVERSITY ADMIN FORM */}
        {role === "admin" && (
          <>
            <input
              name="university"
              placeholder="University Name"
              value={form.university}
              onChange={handleChange}
            />

            <input
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
            />
          </>
        )}

        {/* EVENT ADMIN FORM */}
        {role === "eventAdmin" && (
          <>
            <input
              name="eventName"
              placeholder="Event Name"
              value={form.eventName}
              onChange={handleChange}
            />

            <input
              name="phone"
              placeholder="Contact Number"
              value={form.phone}
              onChange={handleChange}
            />
          </>
        )}

        {/* PARTICIPANT FORM */}
        {role === "participant" && (
          <>
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
            />
          </>
        )}

        {role && (
          <button className="primary" onClick={handleSignup}>
            Signup
          </button>
        )}
      </div>
    </div>
  );
};

export default Signup;
