import React, { useState, useEffect } from "react";
import teacherData from "../data/TeacherData";
import "./teacher.css";
import { addAttendanceRequest } from "../data/AttendenceRequest";
import QRGenerator from "../components/GenerateQRCode";

const TeacherDashboard = ({}) => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const teachers = teacherData;

  if (!currentUser || currentUser.role !== "teacher") {
    return <h2>Unauthorized</h2>;
  }

  const teacher =
    teachers.find(t => t.profile.teacherId === currentUser.id) ||
    teacherData.find(t => t.profile.teacherId === currentUser.id);

  if (!teacher) {
    return <h2>Teacher not found</h2>;
  }
 

  // Safe data extraction
  const teacherProfile = teacher.profile || {};
  const batches = teacher.batches || [];
  const programs = teacher.programs || [];
  const attendanceTypes = teacher.attendanceTypes || [];
  const courses = teacher.courses || [];
  const coursesTeaching = courses.map(c => c.code);

  const profile = {
    name: teacherProfile.name || "N/A",
    teacherId: teacherProfile.teacherId || "N/A",
    department: teacherProfile.department || "N/A",
    coursesTeaching,
    avatar: teacherProfile.avatar || "👩‍🏫",
  };

  // STATES
  const [state, setState] = useState("form");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSlots, setSelectedSlots] = useState("");
  const [geoLocation, setGeoLocation] = useState({ lat: null, lng: null });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // 🔹 UPDATE ATTENDANCE REQUEST FORM STATE

  const [requestForm, setRequestForm] = useState({
  batch: "",
  program: "",
  course: "",
  type: "",
  slots: "",
  reason: ""
});

  // Get geolocation when QR is active
  useEffect(() => {
    if (state === "active" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        err => console.error("Geolocation error:", err)
      );
    }
  }, [state]);

  const logout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  // Reset all selections and QR state
  const resetForm = () => {
    setState("form");
    setSelectedBatch("");
    setSelectedProgram("");
    setSelectedType("");
    setSelectedCourse("");
    setSelectedSlots("");
    setGeoLocation({ lat: null, lng: null });
  };

const submitAttendanceRequest = () => {
  const newRequest = {
    id: Date.now(),
    teacherId: profile.teacherId,
    teacherName: profile.name,
    department: profile.department,
    batch: requestForm.batch,
    program: requestForm.program,
    course: requestForm.course,
    attendanceType: requestForm.type,
    slots: requestForm.slots,
    reason: requestForm.reason,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  console.log("👩‍🏫 Teacher sending request:", newRequest);

  addAttendanceRequest(newRequest); // ✅ SAVE TO LOCAL STORAGE

  alert("Attendance update request sent to admin ✅");
  setShowUpdateModal(false);
};







  return (
    <div className="teacher-wrapper">
      {/* PROFILE CARD */}
      <div className="profile-card">
        <div className="profile-avatar">{profile.avatar}</div>
        <h3>{profile.name}</h3>
        <p><strong>Teacher ID:</strong> {profile.teacherId}</p>
        <p><strong>Department:</strong> {profile.department}</p>
        <div className="teach-list">
          <strong>Courses Teaching:</strong><br />
          {profile.coursesTeaching.join(", ")}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="right-section">
        <div className="top-actions">
          <button className="update-btn" onClick={() => setShowUpdateModal(true)}>
            🔄 Update Attendance Request
          </button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>

        <div className="welcome-banner">
          Welcome back, {profile.name}!
        </div>

       {/* UPDATE MODAL */}
{showUpdateModal && (
  <div className="modal-overlay">
    <div className="modal-box">

      <div className="modal-header">
        <h3>Update Attendance Request</h3>
        <span
          className="close-btn"
          onClick={() => setShowUpdateModal(false)}
        >
          ✖
        </span>
      </div>

      <div className="modal-content">

        {/* Batch */}
        <label>Batch</label>
        <select
          value={requestForm.batch}
          onChange={(e) =>
            setRequestForm({ ...requestForm, batch: e.target.value })
          }
        >
          <option value="">Select batch</option>
          {batches.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Program */}
        <label>Program</label>
        <select
          value={requestForm.program}
          onChange={(e) =>
            setRequestForm({ ...requestForm, program: e.target.value })
          }
        >
          <option value="">Select program</option>
          {programs.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Course */}
        <label>Course Name</label>
        <select
          value={requestForm.course}
          onChange={(e) =>
            setRequestForm({ ...requestForm, course: e.target.value })
          }
        >
          <option value="">Select course</option>
          {courses.map(c => (
            <option key={c.code} value={c.code}>
              {c.code} – {c.name}
            </option>
          ))}
        </select>

        {/* Attendance Type */}
        <label>Attendance Type</label>
        <select
          value={requestForm.type}
          onChange={(e) =>
            setRequestForm({ ...requestForm, type: e.target.value })
          }
        >
          <option value="">Select type</option>
          {attendanceTypes.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Slots */}
        <label>Number of Slots</label>
        <input
          type="number"
          placeholder="Enter number of slots"
          value={requestForm.slots}
          onChange={(e) =>
            setRequestForm({ ...requestForm, slots: e.target.value })
          }
        />

        {/* Reason */}
        <label>Reason</label>
        <input
          type="text"
          placeholder="Reason for update"
          value={requestForm.reason}
          onChange={(e) =>
            setRequestForm({ ...requestForm, reason: e.target.value })
          }
        />

      </div>

      <div className="modal-actions">
        <button
          className="cancel-btn"
          onClick={() => setShowUpdateModal(false)}
        >
          Cancel
        </button>

        <button
          className="submit-btn"
          onClick={submitAttendanceRequest}
        >

          Submit
        </button>
      </div>

    </div>
  </div>
)}


        {/* FORM STATE */}
        {state === "form" && (
          <div className="card">
            <div className="card-title">Live Attendance Form</div>
            <div className="card-content">
              <label>Batch</label>
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b}>{b}</option>)}
              </select>

              <label>Program</label>
              <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
                <option value="">Select program</option>
                {programs.map(p => <option key={p}>{p}</option>)}
              </select>

              <label>Attendance Type</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="">Select type</option>
                {attendanceTypes.map(a => <option key={a}>{a}</option>)}
              </select>

              <label>Course Name</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} – {c.name}
                  </option>
                ))}
              </select>

              <label>Number of Slots</label>
              <input
                type="number"
                placeholder="Enter number of slots"
                value={selectedSlots}
                onChange={e => setSelectedSlots(e.target.value)}
              />

              <button
                className="start-btn"
                onClick={() => {
                  if (!selectedCourse || !selectedSlots) {
                    alert("Select course and enter slots");
                    return;
                  }
                  setState("active");
                }}
              >
                ▶ Generate QR
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE QR STATE */}
        {state === "active" && (
          <div className="card active-card">
            <div className="card-title">Live Attendance QR</div>
            <div className="active-box">
              <p><strong>QR Active</strong></p>
              <p><strong>Course:</strong> {selectedCourse}</p>
              <p><strong>Batch:</strong> {selectedBatch}</p>
              <p><strong>Program:</strong> {selectedProgram}</p>
              <p><strong>Type:</strong> {selectedType}</p>
              <p><strong>Slots:</strong> {selectedSlots}</p>
              <p><strong>Geolocation:</strong> {geoLocation.lat && geoLocation.lng ? `${geoLocation.lat}, ${geoLocation.lng}` : "Fetching..."}</p>
            </div>

            <QRGenerator
              key={`${selectedCourse}-${selectedBatch}-${selectedProgram}-${selectedType}-${selectedSlots}-${geoLocation.lat}-${geoLocation.lng}`}
              course={selectedCourse}
              batch={selectedBatch}
              program={selectedProgram}
              type={selectedType}
              slots={selectedSlots}
              geo={geoLocation}
            />

            <button className="stop-btn" onClick={resetForm}>
              ■ Stop QR & Return
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherDashboard;
