// src/components/admin/AttendanceRequests.jsx
import React, { useState, useEffect } from "react";
import AddAttendanceModal from "./AddAttendenceModal";

const AttendanceRequests = ({ requests = [] }) => {
  const [selected, setSelected] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [allRequests, setAllRequests] = useState([]);

  // Load requests from props or localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("attendanceRequests")) || [];
    setAllRequests(stored.length ? stored : requests);
  }, [requests]);

  // Handle accept/reject
  const handleDecision = (id) => {
    const updated = allRequests.filter(r => r.id !== id);
    localStorage.setItem("attendanceRequests", JSON.stringify(updated));
    setAllRequests(updated);
    setShowReview(false);
  };

  if (!allRequests.length) {
    return (
      <div className="content-box">
        <div className="section-title">📋 Pending Attendance Update Requests</div>
        <p style={{ padding: "10px", color: "#777" }}>No attendance update requests yet.</p>
      </div>
    );
  }

  return (
    <div className="content-box">
      <div className="section-title">📋 Pending Attendance Update Requests</div>

      <div className="requests-list">
        {allRequests.map(req => (
          <div className="request-card" key={req.id}>
            <div className="request-left">
              <div><strong>Teacher</strong><br />{req.teacherName}</div>
              <div><strong>Teacher ID</strong><br />{req.teacherId}</div>
              <div><strong>Department</strong><br />{req.department}</div>
              <div><strong>Batch</strong><br />{req.batch}</div>
              <div><strong>Program</strong><br />{req.program}</div>
              <div><strong>Course</strong><br />{req.course}</div>
              <div><strong>Attendance Type</strong><br />{req.attendanceType}</div>
              <div><strong>Slots</strong><br />{req.slots}</div>
              <div><strong>Reason</strong><br /><em>"{req.reason}"</em></div>
              <div><strong>Status</strong><br />{req.status}</div>
              <div><strong>Requested At</strong><br />{req.createdAt ? new Date(req.createdAt).toLocaleString() : "N/A"}</div>
            </div>

            <div className="request-actions">
              <button
                className="review-btn"
                onClick={() => {
                  setSelected(req);
                  setShowReview(true);
                }}
              >
                Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* REVIEW MODAL */}
      {showReview && selected && (
        <AddAttendanceModal
          title={selected.course}
          request={selected}
          onClose={() => setShowReview(false)}
          onAccept={() => handleDecision(selected.id)}
          onReject={() => handleDecision(selected.id)}
        />
      )}
    </div>
  );
};

export default AttendanceRequests;
