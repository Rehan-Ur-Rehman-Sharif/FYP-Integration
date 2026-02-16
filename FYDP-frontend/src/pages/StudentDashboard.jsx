import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import SemesterPerformance from "../components/SemesterPerformance";
import CourseTable from "../components/CourseTable";
import students from "../data/StudentData";
import "./student.css";
import { Html5Qrcode } from "html5-qrcode";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [attendanceJSON, setAttendanceJSON] = useState(null);
  const html5QrCodeRef = useRef(null);
  const alertShownRef = useRef(false);

  const currentUserStr = localStorage.getItem("currentUser");
  let profile = null, overallAttendance = null, courses = [];
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser && currentUser.role === "student") {
        const student = students.find(
          (s) =>
            s.profile.studentId === currentUser.studentId ||
            s.email === currentUser.email
        );
        if (student) {
          profile = student.profile;
          overallAttendance = student.overallAttendance;
          courses = student.courses;
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (!profile) navigate("/login");
  }, [profile, navigate]);

  const handleLogout = () => navigate("/login");

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = await html5QrCodeRef.current.getState();
        if (state === "SCANNING") await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setScannerOpen(false);
    alertShownRef.current = false;
  };

  const startScanner = () => setScannerOpen(true);

  const isWithinGeofence = (userLat, userLng, qrLat, qrLng, radius, accuracy) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(qrLat - userLat);
    const dLng = toRad(qrLng - userLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userLat)) *
        Math.cos(toRad(qrLat)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const practicalRadius = Math.max(radius, 20000); // minimum 20km for classroom
    return distance <= practicalRadius + accuracy; // include GPS accuracy
  };

  useEffect(() => {
    if (!scannerOpen) return;

    const qrRegionId = "qr-reader";
    const startQr = async () => {
      const qrDiv = document.getElementById(qrRegionId);
      if (!qrDiv) return;

      html5QrCodeRef.current = new Html5Qrcode(qrRegionId);

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          alert("No camera devices found.");
          stopScanner();
          return;
        }

        await html5QrCodeRef.current.start(
          { facingMode: "environment" }, // back camera
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (alertShownRef.current) return;
            alertShownRef.current = true;

            stopScanner().then(() => {
              try {
                const qrData = JSON.parse(decodedText);

                if (
                  !qrData.geoLocation ||
                  qrData.geoLocation.lat === undefined ||
                  qrData.geoLocation.lng === undefined ||
                  qrData.geoLocation.radius === undefined
                ) {
                  alert("QR missing geolocation data.");
                  return;
                }

                const { lat: qrLat, lng: qrLng, radius } = qrData.geoLocation;

                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude, accuracy } = position.coords;

                    if (!isWithinGeofence(latitude, longitude, qrLat, qrLng, radius, accuracy)) {
                      alert("You are outside the allowed location for this scan.");
                      return;
                    }
                    if(profile.year !== qrData.batch){
                       alert("invalid batch for this Scan");
                      return;
                    }
                    if(profile.department !== qrData.program){
                       alert("invalid program for this Scan");
                      return;
                    }
                    if(courses.findIndex(c => c.code === qrData.course) === -1){
                       alert("You are not enrolled in the course for this scan.");
                      return;
                    }
                    const attendanceData = {
                      studentName: profile.name,
                      studentRollNo: profile.studentId,
                      course: qrData.course,
                      slot: qrData.slot,
                      date: qrData.date,
                      scannedAt: new Date().toISOString(),
                      geoLocation: {
                        latitude,
                        longitude,
                        accuracy,
                      },
                    };

                    setAttendanceJSON(attendanceData);
                  },
                  () => alert("Geolocation permission denied.")
                );
              } catch {
                alert("Invalid QR code format.");
              }
            });
          }
        );
      } catch (err) {
        console.error(err);
        alert("Camera access failed.");
        stopScanner();
      }
    };

    startQr();
  }, [scannerOpen, profile]);

  useEffect(() => {
    return () => stopScanner();
  }, []);
console.log("Profile data:", profile);  
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-grid">
        <ProfileCard profile={profile} />
        <div className="right-content">
          <div className="heading">
            <h1>Welcome back, {profile?.name || "Student"}!</h1>
            <div className="heading-buttons">
              <button onClick={startScanner} className="mark-attendance-btn">
                Mark Attendance
              </button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {scannerOpen && (
            <div className="qr-scanner-container">
              <h3>Scan QR Code</h3>
              <div id="qr-reader"></div>
            </div>
          )}

          {attendanceJSON && (
            <div className="card" style={{ marginTop: "20px" }}>
              <div className="card-title">Attendance Captured</div>
              <div className="card-content">
                <pre>{JSON.stringify(attendanceJSON, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title">Current Semester Performance</div>
            <div className="card-content">
              <SemesterPerformance overall={overallAttendance} />
            </div>
          </div>

          <div className="card course-table">
            <div className="card-title">Course-wise Attendance</div>
            <div className="card-content">
              <CourseTable courses={courses} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
