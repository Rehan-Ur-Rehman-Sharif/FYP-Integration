import React from "react";

const SemesterPerformance = ({ overall }) => {

  if (!overall) {
    return (
      <div className="performance-card">
        <p className="label">Overall Attendance</p>
        <h2 className="not-available">Not Available</h2>
      </div>
    );
  }

  const statusColor =
    overall.status === "Good"
      ? "green"
      : overall.status === "Average"
      ? "orange"
      : "red";

  return (
    <div className="performance-card">
      <div className="performance-box">
        <div className="performance-item">
          <p className="label">Overall Attendance</p>
          <h2 className="percentage">{overall.percentage}%</h2>
        </div>

        <div className="performance-item">
          <p className="label">Status</p>
          <h2 style={{ color: statusColor }}>
            {overall.status}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default SemesterPerformance;
