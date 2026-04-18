// src/components/admin/AddAttendanceModal.jsx
import React from "react";
import "../../styles/admin.css";

const AddAttendanceModal = ({ title, request, onClose, onAccept, onReject, loading = false }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* Cancel X button */}
        <button className="modal-close" onClick={onClose} disabled={loading}>×</button>
        <h3 style={{ textAlign: "center" }}>{title}</h3>

        <div style={{ padding: "10px 0" }}>
          <p><strong>Teacher:</strong> {request.teacherName}</p>
          <p><strong>Teacher Roll No:</strong> {request.teacherRollNo}</p>
          <p><strong>Student:</strong> {request.studentName}</p>
          <p><strong>Student Roll No:</strong> {request.studentRollNo}</p>
          <p><strong>Department:</strong> {request.department}</p>
          <p><strong>Section:</strong> {request.section}</p>
          <p><strong>Course:</strong> {request.course}</p>
          <p><strong>Attendance Type:</strong> {request.attendanceType}</p>
          <p><strong>Classes To Add:</strong> {request.classesToAdd}</p>
          <p><strong>Status:</strong> {request.status}</p>
          <p><strong>Requested At:</strong> {request.requestedAt}</p>
          <p><strong>Reason:</strong> <em>"{request.reason}"</em></p>
        </div>

        <div className="modal-actions">
          <button onClick={onReject} className="del-btn" disabled={loading}>
            {loading ? "Processing..." : "Reject"}
          </button>
          <button onClick={onAccept} className="primary" disabled={loading}>
            {loading ? "Processing..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAttendanceModal;
