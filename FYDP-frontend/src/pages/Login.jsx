import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginStudent, loginTeacher, loginAdmin, loginParticipant } from "../api/auth";

const Login = () => {
  const [data, setData] = useState({
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (data.role === "student") {
        await loginStudent(data.email, data.password);
        navigate("/student");
      } else if (data.role === "teacher") {
        await loginTeacher(data.email, data.password);
        navigate("/teacher");
      } else if (data.role === "admin") {
        const result = await loginAdmin(data.email, data.password);
        // Route to event admin dashboard if role is event_admin
        navigate(result.role === "event_admin" ? "/eventadmin" : "/admin");
      } else if (data.role === "participant") {
        await loginParticipant(data.email, data.password);
        navigate("/events");
      } else {
        setError("Unsupported role selected.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <div className="max-w-md w-full mx-auto border border-gray-300 rounded-2xl p-8 bg-white">
        <div className="text-red-900 text-center mb-6 text-4xl font-semibold">
          Login
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-red-800 text-sm">Email</label>
          <input
            type="email"
            name="email"
            value={data.email}
            onChange={handleOnChange}
            required
            className="w-full border px-4 py-2 rounded mb-3"
          />

          <label className="block text-red-800 text-sm">Password</label>
          <input
            type="password"
            name="password"
            value={data.password}
            onChange={handleOnChange}
            required
            className="w-full border px-4 py-2 rounded mb-3"
          />

          <label className="block text-red-800 text-sm">Login as</label>
          <select
            name="role"
            value={data.role}
            onChange={handleOnChange}
            className="w-full border px-4 py-2 rounded mb-4"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin / Event Admin</option>
            <option value="participant">Event Participant</option>
          </select>

          <button
            className="w-full bg-red-900 text-white py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Login"}
          </button>

          <div className="text-center mt-3">
            <Link to="/signup" className="text-red-900 text-sm">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

