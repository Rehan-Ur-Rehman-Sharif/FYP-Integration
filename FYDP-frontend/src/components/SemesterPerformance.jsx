import React from "react";

const SemesterPerformance=({overall})=>{
  if (!overall) {
    return (
      <div className="performance-card">
        <p className="label">Overall Attendance</p>
        <h2>Not Available</h2>
      </div>
    );
  }
    return(
        <div className="performance-card">
    

      <div className="performance-box">
        <div>
          <p className="label">Overall Attendance</p>
          <h2>{overall.percentage}%</h2>
        </div>

        <div>
          <p className="label">Status</p>
          <h2 style={{ color: "green" }}>{overall.status}</h2>
        </div>
      </div>
    </div>
    );
};

export default SemesterPerformance;