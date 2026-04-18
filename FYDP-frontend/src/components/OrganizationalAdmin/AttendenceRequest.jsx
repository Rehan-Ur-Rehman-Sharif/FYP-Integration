// src/components/admin/AttendanceRequests.jsx
import React, { useState } from "react";
import axios from "../../utils/axiosInstance";
import { ClipboardList } from "lucide-react";
import AddAttendanceModal from "./AddAttendenceModal";

const AttendanceRequests = ({ requests = [], onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleString();
  };

  const handleDecision = async (id, action) => {
    setActionLoading(true);
    try {
      await axios.post(
        `/api/update-attendance-requests/${id}/${action}/`,
        {}
      );
      setShowReview(false);
      setSelected(null);
      onRefresh?.();
    } catch (err) {
      alert(`Failed to ${action} request. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!requests.length) {
    return (
      <div className="content-box">
        <div className="section-title">
          <span className="section-title-left">Pending Attendance Update Requests</span>
        </div>
        <p style={{ padding: "10px", color: "#777" }}>No attendance update requests yet.</p>
      </div>
    );
  }

  return (
    <div className="content-box">
      <div className="section-title">
        <span className="section-title-left">
          <ClipboardList size={22} />
          <span>Pending Attendance Update Requests</span>
        </span>
      </div>

      <div className="requests-list">
        {requests.map(req => (
          <div className="request-card" key={req.id}>
            <div className="request-left">
              <div><strong>Teacher</strong><br />{req.teacher_name ?? req.teacherName ?? "N/A"}</div>
              <div><strong>Teacher Roll No</strong><br />{req.teacher_rollNo ?? "N/A"}</div>
              <div><strong>Student</strong><br />{req.student_name ?? "N/A"}</div>
              <div><strong>Student Roll No</strong><br />{req.student_rollNo ?? "N/A"}</div>
              <div><strong>Department</strong><br />{req.student_dept ?? req.department ?? "N/A"}</div>
              <div><strong>Section</strong><br />{req.student_section ?? "N/A"}</div>
              <div><strong>Course</strong><br />{req.course_name ?? req.course ?? "N/A"}</div>
              <div><strong>Attendance Type</strong><br />{req.attendance_type ?? req.attendanceType ?? "N/A"}</div>
              <div><strong>Classes To Add</strong><br />{req.classes_to_add ?? req.slots ?? "N/A"}</div>
              <div><strong>Reason</strong><br /><em>"{req.reason ?? ""}"</em></div>
              <div><strong>Management</strong><br />{req.management_name ?? "N/A"}</div>
              <div><strong>Status</strong><br />{req.status ?? "N/A"}</div>
              <div><strong>Requested At</strong><br />{formatDateTime(req.requested_at ?? req.created_at ?? req.createdAt)}</div>
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
          title={selected.course_name ?? selected.course}
          request={{
            teacherName: selected.teacher_name ?? selected.teacherName ?? "N/A",
            teacherRollNo: selected.teacher_rollNo ?? "N/A",
            studentName: selected.student_name ?? "N/A",
            studentRollNo: selected.student_rollNo ?? "N/A",
            department: selected.student_dept ?? selected.department ?? "N/A",
            section: selected.student_section ?? "N/A",
            course: selected.course_name ?? selected.course ?? "N/A",
            attendanceType: selected.attendance_type ?? selected.attendanceType ?? "N/A",
            classesToAdd: selected.classes_to_add ?? selected.slots ?? "N/A",
            reason: selected.reason ?? "",
            status: selected.status ?? "N/A",
            requestedAt: formatDateTime(selected.requested_at ?? selected.created_at ?? selected.createdAt),
          }}
          onClose={() => { setShowReview(false); setSelected(null); }}
          onAccept={() => handleDecision(selected.id, "approve")}
          onReject={() => handleDecision(selected.id, "reject")}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default AttendanceRequests;
