import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "../../components/ProfileCard";
import CourseTable from "../../components/CourseTable";
import "./student.css";
import { Html5Qrcode } from "html5-qrcode";
import bgImage from "../../assets/background.jpeg";
import axiosInstance from "../../utils/axiosInstance";

const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => reject(err)
    );
  });

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scanInFlightRef = useRef(false);

  const [authStudentId, setAuthStudentId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [overallAttendance, setOverallAttendance] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        navigate("/login");
        return;
      }

      const currentUser = JSON.parse(stored);
      if (currentUser.role !== "student") {
        navigate("/login");
        return;
      }

      const id = currentUser.student_id ?? currentUser.studentId ?? currentUser.id;
      if (!id) {
        navigate("/login");
        return;
      }

      const parsedAuthId = Number(id);
      setAuthStudentId(Number.isFinite(parsedAuthId) ? parsedAuthId : null);

      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/api/students/${id}/`);

        if (!Number.isFinite(parsedAuthId)) {
          const fromApi = Number(data?.id ?? data?.student_id);
          if (Number.isFinite(fromApi)) setAuthStudentId(fromApi);
        }

        // Map API response to UI-friendly shape
        const mappedProfile = {
          name: data.student_name,
          email: data.email,
          studentId: data.student_id || data.student_rollNo,
          year: data.year,
          section: data.section,
          department: data.dept || data.program,
        };

        const toNumber = (value) => {
          const n = Number(value);
          return Number.isFinite(n) ? n : null;
        };

        const mappedCourses = (data.courses || []).map((c) => {
          const present =
            toNumber(
              c.classes_attended_count ??
                c.present ??
                c.attended ??
                c.attended_count
            ) ?? 0;

          const missed =
            toNumber(
              c.classes_missed_count ??
                c.absent ??
                c.absent_count ??
                c.classes_absent_count
            ) ?? 0;

          let total =
            toNumber(
              c.classes_total_count ??
                c.total_classes_count ??
                c.total_classes ??
                c.classes_held_count ??
                c.classes_count ??
                c.total ??
                c.session_count
            ) ?? 0;

          if (!total && (present || missed)) total = present + missed;

          const attendance = total > 0 ? Math.round((present / total) * 100) : 0;

          return {
            code: c.course_code || String(c.course_id ?? c.course ?? ""),
            name: c.course_name ?? c.name ?? "N/A",
            attendance,
            present,
            total,
          };
        });

        const overallFromApi = toNumber(data.overall_attendance);

        const totals = mappedCourses.reduce(
          (acc, c) => ({
            present: acc.present + (Number(c.present) || 0),
            total: acc.total + (Number(c.total) || 0),
          }),
          { present: 0, total: 0 }
        );

        const overallFromCourses =
          totals.total > 0
            ? Math.round((totals.present / totals.total) * 100)
            : null;

        const percentage =
          overallFromApi == null
            ? overallFromCourses ?? 0
            : overallFromApi === 0 && overallFromCourses != null && overallFromCourses > 0
              ? overallFromCourses
              : overallFromApi;

        const mappedOverall = {
          percentage,
          status: Number(percentage) >= 75 ? "Good" : "Below Average",
        };

        setProfile(mappedProfile);
        setOverallAttendance(mappedOverall);
        setCourses(mappedCourses);
      } catch (err) {
        setError("Failed to load profile. Please login again.");
        localStorage.removeItem("currentUser");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  /* ================= QR SCANNER ================= */
  const stopScanner = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
    } catch {}
    html5QrCodeRef.current = null;
    setScannerOpen(false);
  };

  const startScanner = () => setScannerOpen(true);

  useEffect(() => {
    if (!scannerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [scannerOpen]);

  useEffect(() => {
    if (!scannerOpen) return;

    const startQr = async () => {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      try {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          handleScanSuccess
        );
      } catch {
        alert("Camera access failed.");
        stopScanner();
      }
    };

    startQr();
    return () => stopScanner();
  }, [scannerOpen]);

  const handleScanSuccess = async (decodedText) => {
    if (scanInFlightRef.current) return;
    scanInFlightRef.current = true;

    await stopScanner();

    let qrTokenCandidate = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      qrTokenCandidate =
        parsed?.qr_token ??
        parsed?.qrToken ??
        parsed?.token ??
        parsed?.qr ??
        decodedText;
    } catch {
      // If QR is not JSON, treat it as raw token.
    }

    const qrToken = String(qrTokenCandidate || "").trim();
    if (!qrToken) {
      alert("Invalid QR token.");
      scanInFlightRef.current = false;
      return;
    }

    if (!authStudentId) {
      alert("Student session is missing an id. Please login again.");
      scanInFlightRef.current = false;
      return;
    }

    let location;
    try {
      location = await getCurrentLocation();
    } catch {
      alert("Location permission is required to mark attendance.");
      scanInFlightRef.current = false;
      return;
    }

    try {
      const payload = {
        qr_token: qrToken,
        student_id: authStudentId,
        latitude: location.lat,
        longitude: location.lng,
      };

      const { data } = await axiosInstance.post("/api/attendance/qr-scan/", payload);

      const msg = data?.message || "QR code scanned successfully";
      if (data?.needs_rfid) {
        alert(`${msg}\n\nRFID scan is still required.`);
      } else {
        alert(msg);
      }
    } catch (err) {
      const result = err.response?.data;
      const messages = result ? Object.values(result).flat().join(" ") : "Failed to scan QR code.";
      alert(messages || "Failed to scan QR code.");
    } finally {
      scanInFlightRef.current = false;
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!profile) return null;

  return (
    <div
      className="dashboard-bg"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="dashboard-wrapper">
        <div className="dashboard-grid">
          {/* LEFT: Profile Card */}
          <ProfileCard profile={profile} onScanClick={startScanner} />

          {/* RIGHT: Main Content */}
          <div className="dashboard-right">
            {/* Welcome heading */}
            <div className="dashboard-welcome">
              <div className="welcome-text">
                <span className="mainhead">Welcome back,</span> {profile.name}!
              </div>
            </div>

            {/* QR Scanner Modal */}
            {scannerOpen && (
              <div
                className="qr-modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-label="Scan QR Code"
                onClick={stopScanner}
              >
                <div
                  className="qr-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="qr-modal-header">
                    <h3>Scan QR Code</h3>
                    <button
                      type="button"
                      className="qr-modal-close"
                      onClick={stopScanner}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div id="qr-reader"></div>
                </div>
              </div>
            )}

            {/* Semester Performance */}
            <div className="performance-card">
              <div className="performance-header">
                Current Semester Performance
              </div>
              <div className="performance-body">
                <div className="attendance-section">
                  <p className="label">Overall Attendance</p>
                  <h1 className="percentage">{overallAttendance?.percentage}%</h1>
                </div>
                <div className="status-ring-wrapper">
                  <div className="status-section">
                    <p className="label">Status:</p>
                    <h2 className="status-text">{overallAttendance?.status}</h2>
                  </div>
                  <div className="progress-ring">
                    <svg width="90" height="90">
                      <circle className="ring-bg" cx="45" cy="45" r="38" />
                      <circle
                        className="ring-progress"
                        cx="45"
                        cy="45"
                        r="38"
                        style={{
                          strokeDasharray: 2 * Math.PI * 38,
                          strokeDashoffset:
                            2 * Math.PI * 38 * (1 - overallAttendance?.percentage / 100),
                        }}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Table */}
            <div className="performance-card">
              <div className="performance-header">Course-wise Attendance</div>
              <div className="card-content">
                <CourseTable courses={courses} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;