// src/components/admin/AttendanceRequests.jsx
import React, { useState } from "react";
import AddAttendanceModal from "./AddAttendenceModal";
import { approveAttendanceRequest, rejectAttendanceRequest } from "../../api/admin";

const AttendanceRequests = ({ requests = [], onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [allRequests, setAllRequests] = useState(requests);

  // Sync with parent data when requests prop changes
  React.useEffect(() => {
    setAllRequests(requests);
  }, [requests]);

  const handleDecision = async (id, approve) => {
    try {
      if (approve) {
        await approveAttendanceRequest(id);
      } else {
        await rejectAttendanceRequest(id);
      }
      setAllRequests((prev) => prev.filter((r) => r.id !== id));
      setShowReview(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(
        err.response?.data?.error ||
        "Failed to process request. Please try again."
      );
    }
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
              <div><strong>Teacher</strong><br />{req.teacher_name}</div>
              <div><strong>Course</strong><br />{req.course_name}</div>
              <div><strong>Batch</strong><br />{req.batch || "—"}</div>
              <div><strong>Program</strong><br />{req.program || "—"}</div>
              <div><strong>Attendance Type</strong><br />{req.attendance_type || "—"}</div>
              <div><strong>Slots</strong><br />{req.slots ?? "—"}</div>
              <div><strong>Reason</strong><br /><em>"{req.reason}"</em></div>
              <div><strong>Status</strong><br />{req.status}</div>
              <div><strong>Requested At</strong><br />{req.requested_at ? new Date(req.requested_at).toLocaleString() : "N/A"}</div>
            </div>

            <div className="request-actions">
              <button
                className="review-btn"
                onClick={() => { setSelected(req); setShowReview(true); }}
              >
                Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {showReview && selected && (
        <AddAttendanceModal
          title={selected.course_name}
          request={selected}
          onClose={() => setShowReview(false)}
          onAccept={() => handleDecision(selected.id, true)}
          onReject={() => handleDecision(selected.id, false)}
        />
      )}
    </div>
  );
};

export default AttendanceRequests;

