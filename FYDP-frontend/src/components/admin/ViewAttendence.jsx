// src/components/admin/ViewAttendance.jsx
import React, { useState } from "react";
import AddAttendanceModal from "./AddAttendenceModal";
import summaryApi from "../../common/index";


const ViewAttendance = ({ years, batches, programs, courses, records }) => {
  const [subTab, setSubTab] = useState("individual"); // or "coursewise"

  // ── Individual student search state ──────────────────────────────
  const [roll, setRoll] = useState("");
  const [batch, setBatch] = useState("");
  const [program, setProgram] = useState("");
  const [studentResult, setStudentResult] = useState(null);  // backend response
  const [studentSearched, setStudentSearched] = useState(false);

  // ── Course-wise state ─────────────────────────────────────────────
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseRecordsBackend, setCourseRecordsBackend] = useState(null);  // backend response

  // ── Add attendance modal ──────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fallback to static prop records when backend is unavailable
  const courseRecordsFallback = records ? (records[selectedCourse] || []) : [];

  /* ------------------------------------------------------------------
    Individual student search – calls GET /api/attendance/student/?student_rollNo=X
  ------------------------------------------------------------------ */
  const handleIndividualSearch = async () => {
    if (!roll.trim()) {
      alert("Please enter a roll number");
      return;
    }
    setStudentSearched(true);
    setStudentResult(null);

    try {
      const token = localStorage.getItem("accessToken");
      const url = `${summaryApi.studentAttendance.url}?student_rollNo=${encodeURIComponent(roll.trim())}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStudentResult(data);
        return;
      }
    } catch (_error) { // API unreachable – use offline fallback
      // API unreachable – show placeholder
    }
  };

  /* ------------------------------------------------------------------
     Course-wise attendance – calls GET /api/attendance/course/?course_code=X
  ------------------------------------------------------------------ */
  const handleCourseView = async () => {
    if (!selectedCourse) return;
    setCourseRecordsBackend(null);

    try {
      const token = localStorage.getItem("accessToken");
      const url = `${summaryApi.courseAttendance.url}?course_code=${encodeURIComponent(selectedCourse)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCourseRecordsBackend(data.students || []);
        return;
      }
    } catch (_error) { // API unreachable – use offline fallback
      // API unreachable – fall back to static prop records
    }
    setCourseRecordsBackend(null);
  };

  // The rows to show in the course-wise table
  const courseRows = courseRecordsBackend !== null
    ? courseRecordsBackend
    : courseRecordsFallback;

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
            <button className="primary" onClick={handleIndividualSearch}>Search</button>
          </div>

          {!studentSearched && (
            <div className="placeholder">Enter student details and click Search to view attendance records</div>
          )}

          {studentSearched && !studentResult && (
            <div className="placeholder">No student found for roll number: {roll}</div>
          )}

          {studentResult && (
            <div>
              <h4>
                {studentResult.name} &nbsp;|&nbsp; Roll: {studentResult.student_rollNo} &nbsp;|&nbsp;
                Year {studentResult.year} &nbsp;|&nbsp; {studentResult.program} &nbsp;|&nbsp;
                Section {studentResult.section}
              </h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course Code</th><th>Course Name</th><th>Teacher</th>
                    <th>Total Sessions</th><th>Attended</th><th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResult.courses.map(c => (
                    <tr key={c.course_id}>
                      <td>{c.course_code}</td>
                      <td>{c.course_name}</td>
                      <td>{c.teacher_name}</td>
                      <td>{c.total_sessions}</td>
                      <td>{c.attended}</td>
                      <td>
                        <span className={c.percent >= 85 ? "green-badge" : c.percent >= 75 ? "yellow-badge" : "red-badge"}>
                          {c.percent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {subTab === "coursewise" && (
        <>
          <div className="filters">
            <select value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
            <button className="primary" onClick={handleCourseView}>View Attendance</button>
          </div>

          <h4 className="course-heading">Showing attendance for: {selectedCourse ? selectedCourse + " - " + courses.find(x=>x.code===selectedCourse)?.name : "—"}</h4>

          <table className="data-table">
            <thead>
              <tr>
                <th>Roll Number</th><th>Name</th><th>Year</th><th>Program</th><th>Total Classes</th><th>Attended</th><th>Percentage</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courseRows.map(s => (
                <tr key={s.roll || s.student_rollNo}>
                  <td>{s.roll || s.student_rollNo}</td>
                  <td>{s.name}</td>
                  <td>{s.year || s.batch}</td>
                  <td>{s.program}</td>
                  <td>{s.total_sessions ?? s.total}</td>
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
          studentName={`${selectedStudent.name} (${selectedStudent.roll || selectedStudent.student_rollNo})`}
          defaultCourse={selectedCourse}
          onClose={() => setShowAddModal(false)}
          onSubmit={(payload) => { console.log("Add attendance:", payload); setShowAddModal(false); alert("Attendance added (demo)."); }}
        />
      )}
    </div>
  );
};

export default ViewAttendance;
