import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { startSession, stopSession } from "../api/teachers";

/**
 * QR Code generator component wired to the backend attendance session API.
 *
 * Props:
 *   teacherId   - backend integer teacher_id
 *   courseId    - backend integer course_id
 *   section     - section string e.g. "A"
 *   year        - integer academic year level
 *   program     - program string e.g. "BSCS" (optional)
 *   sessionType - "Lecture" | "Lab" (optional)
 *   requireRfid - boolean, default true
 *   geo         - { lat, lng } from browser geolocation (optional)
 */
const QRGenerator = ({
  teacherId,
  courseId,
  section,
  year,
  program = "",
  sessionType = "",
  requireRfid = true,
  geo = {},
}) => {
  const [session, setSession] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!teacherId || !courseId || !section || !year) {
      setError("teacher, course, section and year are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        teacher: teacherId,
        course: courseId,
        section,
        year,
        program,
        session_type: sessionType,
        require_rfid: requireRfid,
      };
      if (geo.lat) { payload.latitude = geo.lat; payload.longitude = geo.lng; }
      const result = await startSession(payload);
      setSession(result.session);
      setQrToken(result.session.qr_code_token);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start session.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!session) return;
    try {
      await stopSession(session.id);
      setSession(null);
      setQrToken(null);
    } catch (err) {
      setError("Failed to stop session.");
    }
  };

  if (error) {
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  }

  if (!session) {
    return (
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          onClick={handleStart}
          disabled={loading}
          style={{ padding: "10px 24px", background: "#7f0000", color: "#fff", borderRadius: 6, cursor: "pointer" }}
        >
          {loading ? "Starting…" : "Start Attendance Session"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <p style={{ color: "green", fontWeight: "bold" }}>✅ Session active — students can scan the QR code</p>
      <QRCode
        value={qrToken}
        size={300}
        level="H"
        bgColor="#ffffff"
        fgColor="#000000"
        style={{ margin: "auto", marginTop: 16 }}
      />
      <p style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
        Session ID: {session.id} &nbsp;|&nbsp; Token: {qrToken.slice(0, 16)}…
      </p>
      <button
        onClick={handleStop}
        style={{ marginTop: 16, padding: "8px 20px", background: "#c0392b", color: "#fff", borderRadius: 6, cursor: "pointer" }}
      >
        Stop Session
      </button>
    </div>
  );
};

export default QRGenerator;

