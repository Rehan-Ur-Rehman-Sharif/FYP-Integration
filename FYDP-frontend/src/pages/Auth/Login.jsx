import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./login1.css";
import "./SignUp";
import loginImage from "../../assets/login_image1 .png";

const Login = () => {
  const [data, setData] = useState({
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("login-bg");

    return () => {
      document.body.classList.remove("login-bg");
    };
  }, []);

  const navigate = useNavigate();

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    /* =========================
       STUDENT LOGIN (API)
    ========================= */
    if (data.role === "student") {
      try {
        setLoading(true);
        const { data: result } = await axios.post("/api/auth/login/student/", {
          email: data.email,
          password: data.password,
        });

        // Persist session info expected by axiosInstance
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            role: "student",
            token: result.access,
            refresh: result.refresh,
            user_type: result.user_type,
            student_id: result.student_id,
            student_name: result.student_name,
            email: result.email,
          })
        );

        navigate("/student");
        return;
      } catch (err) {
        const result = err.response?.data;
        if (result) {
          const messages = Object.values(result).flat().join(" ");
          setError(messages || "Invalid credentials. Please try again.");
        } else {
          setError("Network error. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    /* =========================
       TEACHER LOGIN
    ========================= */
    if (data.role === "teacher") {
      try {
        setLoading(true);
        const { data: result } = await axios.post("/api/auth/login/teacher/", {
          email: data.email,
          password: data.password,
        });

        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            role: "teacher",
            id: result.teacher_id,
            name: result.teacher_name,
            token: result.access,
            refresh: result.refresh,
            user_type: result.user_type,
            teacher_id: result.teacher_id,
            teacherId: result.teacher_id,
            teacher_name: result.teacher_name,
            email: result.email,
          })
        );

        navigate("/teacher");
      } catch (err) {
        const result = err.response?.data;
        if (result) {
          const messages = Object.values(result).flat().join(" ");
          setError(messages || "Invalid credentials. Please try again.");
        } else {
          setError("Network error. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    /* =========================
       ADMIN LOGIN
    ========================= */
    if (data.role === "orgadmin") {
      try {
        setLoading(true);
        const { data: result } = await axios.post("/api/auth/login/management/", {
          email: data.email,
          password: data.password,
        });

        // Fetch full management profile using the returned id and token
        const { data: profile } = await axios.get(
          `/api/management/${result.management_id}/`,
          { headers: { Authorization: `Bearer ${result.access}` } }
        );

        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            role: "orgadmin",
            email: result.email,
            token: result.access,
            refresh: result.refresh,
            user_type: result.user_type,
            management_id: result.management_id,
            management_name: profile.Management_name ?? result.management_name,
          })
        );

        navigate("/orgadmin");
      } catch (err) {
        const result = err.response?.data;
        if (result) {
          const messages = Object.values(result).flat().join(" ");
          setError(messages || "Invalid credentials. Please try again.");
        } else {
          setError("Network error. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-left">
          <div className="login-left-inner">
            <div className="login-heading">Login</div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={data.email}
                onChange={handleOnChange}
                placeholder="Email"
                required
                className="login-input"
              />

              <label className="login-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                name="password"
                value={data.password}
                onChange={handleOnChange}
                required
                className="login-input"
              />

              <label className="login-label" htmlFor="login-role">
                Login as
              </label>
              <select
                id="login-role"
                name="role"
                value={data.role}
                onChange={handleOnChange}
                className="login-input"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="orgadmin">Organization Admin</option>
                <option value="advisor">Event Admin</option>
                <option value="participant">Participant</option>
              </select>

              {error && (
                <p style={{ color: "red", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  {error}
                </p>
              )}
              <button className="login-button" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="login-forgot-wrap">Don't Have Account?         
                <Link to="/SignUp" className="login-forgot">
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="login-card-right" aria-hidden="true">
          <img className="login-image" src={loginImage} alt="" />
        </div>
      </div>
    </div>
  );
};

export default Login;