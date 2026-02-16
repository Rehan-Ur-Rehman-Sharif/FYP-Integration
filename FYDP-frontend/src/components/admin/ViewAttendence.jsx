// src/components/admin/ViewAttendance.jsx
import React, { useState } from "react";
import AddAttendanceModal from "./AddAttendenceModal";


const ViewAttendance = ({ years, batches, programs, courses, records }) => {
  const [subTab, setSubTab] = useState("individual"); // or "coursewise"
  const [roll, setRoll] = useState("");
  const [batch, setBatch] = useState("");
  const [program, setProgram] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const courseRecords = records[selectedCourse] || [];

  return (
    <div className="content-box">
      <div className="section-title"> 📋View Student Attendance</div>

      <div className="sub-tabs">
       <div className="ind"> <button className={subTab==="individual"?"active":""} onClick={()=>setSubTab("individual")}>Individual Student Search</button></div>
       <div className="course"> <button className={subTab==="coursewise"?"active":""} onClick={()=>setSubTab("coursewise")}>Course-wise Attendance</button></div>
      </div>
      <br />

      {subTab === "individual" && (
        <>
          <div className="filters">
            <input placeholder="Search by roll number" value={roll} onChange={(e)=>setRoll(e.target.value)} />
            <select value={batch} onChange={(e)=>setBatch(e.target.value)}><option>All batches</option>{batches.map(b=> <option key={b}>{b}</option>)}</select>
            <select value={program} onChange={(e)=>setProgram(e.target.value)}><option>All programs</option>{programs.map(p=> <option key={p}>{p}</option>)}</select>
            <button className="primary">Search</button>
          </div>

          <div className="placeholder">Enter student details and click Search to view attendance records</div>
        </>
      )}

      {subTab === "coursewise" && (
        <>
          <div className="filters">
            <select value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
            <button className="primary" onClick={() => { /* no-op demo */ }}>View Attendance</button>
          </div>

          <h4 className="course-heading">Showing attendance for: {selectedCourse ? selectedCourse + " - " + courses.find(x=>x.code===selectedCourse)?.name : "—"}</h4>

          <table className="data-table">
            <thead>
              <tr>
                <th>Roll Number</th><th>Name</th><th>Batch</th><th>Program</th><th>Total Classes</th><th>Attended</th><th>Percentage</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courseRecords.map(s => (
                <tr key={s.roll}>
                  <td>{s.roll}</td>
                  <td>{s.name}</td>
                  <td>{s.batch}</td>
                  <td>{s.program}</td>
                  <td>{s.total}</td>
                  <td>{s.attended}</td>
                  <td><span className={s.percent >= 85 ? "green-badge" : s.percent >= 75 ? "yellow-badge" : "red-badge"}>{s.percent}%</span></td>
                  <td><button className="add-btn" onClick={() => { setSelectedStudent(s); setShowAddModal(true); }}>Add</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showAddModal && selectedStudent && (
        <AddAttendanceModal
          title="Add Attendance"
          studentName={`${selectedStudent.name} (${selectedStudent.roll})`}
          defaultCourse={selectedCourse}
          onClose={() => setShowAddModal(false)}
          onSubmit={(payload) => { console.log("Add attendance:", payload); setShowAddModal(false); alert("Attendance added (demo)."); }}
        />
      )}
    </div>
  );
};

export default ViewAttendance;
