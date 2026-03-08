import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import summaryApi from "../common/index";
import teacherData from "../data/TeacherData";
import adminData from "../data/AdminData";

const Login = () => {
  const [data, setData] = useState({
    email: "",
    password: "",
    role: "student",
  });

  const navigate = useNavigate();

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  /* ------------------------------------------------------------------
     Try the backend API first; fall back to localStorage / static data
     when the API is unavailable (e.g. during local-only development).
  ------------------------------------------------------------------ */
  const loginViaApi = async () => {
    const response = await fetch(summaryApi.login.url, {
      method: summaryApi.login.method.toUpperCase(),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        role: data.role,
      }),
    });

    if (!response.ok) return null;
    return response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Try backend API ──────────────────────────────────────────────
    try {
      const result = await loginViaApi();
      if (result && result.access) {
        // Store JWT tokens and current user info
        localStorage.setItem("accessToken", result.access);
        localStorage.setItem("refreshToken", result.refresh);
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            role: result.user_type,
            id: result.id,
            name: result.name,
            email: result.email,
          })
        );
        navigate(`/${result.user_type === "admin" ? "admin" : result.user_type}`);
        return;
      }
    } catch (_) {
      // API unreachable – fall through to localStorage fallback
    }

    // ── Fallback: local data ─────────────────────────────────────────
    /* =========================
       STUDENT LOGIN
    ========================= */
    if (data.role === "student") {
      const students = JSON.parse(localStorage.getItem("students")) || [];

      const student = students.find(
        (s) =>
          (s.email === data.email || s.id === data.email) &&
          s.password === data.password
      );

      if (student) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            role: "student",
            id: student.id,
            name: student.name,
            email: student.email,
          })
        );

        navigate("/student");
        return;
      }

      alert("Invalid student credentials");
      return;
    }

    /* =========================
       TEACHER LOGIN
    ========================= */
    if (data.role === "teacher") {
      const teacher = teacherData.find(
        (t) =>
          t.profile.email === data.email &&
          t.profile.password === data.password
      );

      if (teacher) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            role: "teacher",
            id: teacher.profile.teacherId,
            name: teacher.profile.name,
            email: teacher.profile.email,
          })
        );

        // Store teacher in expected format for dashboard
        localStorage.setItem(
          "teachers",
          JSON.stringify([
            {
              id: teacher.profile.teacherId,
              name: teacher.profile.name,
              dept: teacher.profile.department,
              courses: teacher.profile.coursesTeaching.join(","),
            },
          ])
        );

        navigate("/teacher");
        return;
      }

      alert("Invalid teacher credentials");
      return;
    }

    /* =========================
       ADMIN LOGIN
    ========================= */
    if (data.role === "admin") {
      const admin = adminData.profile;

      if (
        admin.email === data.email &&
        admin.password === data.password
      ) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            role: "admin",
            id: admin.adminId,
            name: admin.name,
            email: admin.email,
            department: admin.department,
          })
        );

        navigate("/admin");
        return;
      }

      alert("Invalid admin credentials");
      return;
    }

  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <div className="max-w-md w-full mx-auto border border-gray-300 rounded-2xl p-8 bg-white">
        <div className="text-red-900 text-center mb-6 text-4xl font-semibold">
          Login
        </div>

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
            <option value="admin">Admin</option>
            <option value="advisor">Advisor</option>
          </select>

          <button className="w-full bg-red-900 text-white py-2 rounded">
            Login
          </button>

          <div className="text-center mt-3">
            <Link to="/forgot-password" className="text-red-900 text-sm">
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

