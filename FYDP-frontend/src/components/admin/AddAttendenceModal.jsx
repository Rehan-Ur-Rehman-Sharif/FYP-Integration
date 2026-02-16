// src/components/admin/AddAttendanceModal.jsx
import React from "react";
import "../../styles/admin.css";

const AddAttendanceModal = ({ title, request, onClose, onAccept, onReject }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* Cancel X button */}
        <button className="modal-close" onClick={onClose}>×</button>
        <h3 style={{ textAlign: "center" }}>{title}</h3>

        <div style={{ padding: "10px 0" }}>
          <p><strong>Teacher:</strong> {request.teacherName} ({request.teacherId})</p>
          <p><strong>Department:</strong> {request.department}</p>
          <p><strong>Batch:</strong> {request.batch}</p>
          <p><strong>Program:</strong> {request.program}</p>
          <p><strong>Course:</strong> {request.course}</p>
          <p><strong>Attendance Type:</strong> {request.attendanceType}</p>
          <p><strong>Slots:</strong> {request.slots}</p>
          <p><strong>Reason:</strong> <em>"{request.reason}"</em></p>
        </div>

        <div className="modal-actions">
          <button onClick={onReject} className="del-btn">Reject</button>
          <button onClick={onAccept} className="primary">Accept</button>
        </div>
      </div>
    </div>
  );
};

export default AddAttendanceModal;
