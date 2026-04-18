// src/components/admin/ViewAttendance.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import axios from "../../utils/axiosInstance";


const normalizeCourseCode = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.split("-")[0].trim().split(" ")[0].trim();
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeApiCoursewiseRows = (data, selectedCourseCode) => {
  const rawStudents = Array.isArray(data)
    ? data
    : Array.isArray(data?.students)
      ? data.students
      : Array.isArray(data?.results)
        ? data.results
        : data && typeof data === "object" && (data.student_rollNo || data.student_id)
          ? [data]
          : [];

  return rawStudents.map((student, index) => {
    const roll = String(
      student?.student_rollNo ?? student?.roll_no ?? student?.roll ?? student?.studentId ?? student?.student_id ?? "-"
    ).trim() || "-";
    const name = String(
      student?.name ?? student?.student_name ?? student?.full_name ?? "-"
    ).trim() || "-";
    const batch = String(student?.year ?? student?.batch ?? "-").trim() || "-";
    const program = String(
      student?.program ?? student?.dept ?? student?.department ?? "-"
    ).trim() || "-";

    const attended = toNumber(student?.attended);
    const total = toNumber(student?.total_sessions);
    const computedPercent = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;
    const percent = Number.isFinite(Number(student?.percent))
      ? Number(student.percent)
      : computedPercent;

    return {
      key: `${selectedCourseCode}-${roll}-${index}`,
      roll,
      name,
      batch,
      program,
      attended,
      total,
      percent,
    };
  });
};

const normalizeApiIndividualStudents = (data) => {
  const students = Array.isArray(data?.students)
    ? data.students
    : data && typeof data === "object" && (data.student_id || data.student_rollNo)
      ? [data]
      : [];

  return students.map((student, studentIndex) => {
    const studentId = student?.student_id ?? "-";
    const studentRoll = student?.student_rollNo ?? "-";
    const studentName = student?.name ?? "-";
    const year = student?.year ?? "-";
    const program = student?.program ?? "-";

    const courses = Array.isArray(student?.courses)
      ? student.courses.map((course, courseIndex) => {
      const attended = toNumber(course?.attended);
      const total = toNumber(course?.total_sessions);
      const computedPercent = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;
      const percent = Number.isFinite(Number(course?.percent))
        ? Number(course.percent)
        : computedPercent;

      return {
        key: `${studentId}-${course?.course_id ?? courseIndex}-${studentIndex}`,
        courseCode: course?.course_code ?? "-",
        courseName: course?.course_name ?? "-",
        teacherName: course?.teacher_name ?? "-",
        attended,
        total,
        percent,
      };
    })
      : [];

    const totalSessions = courses.reduce((sum, course) => sum + toNumber(course.total), 0);
    const totalAttended = courses.reduce((sum, course) => sum + toNumber(course.attended), 0);
    const computedOverall = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 1000) / 10 : null;
    const overallAttendance =
      computedOverall !== null
        ? computedOverall
        : Number.isFinite(Number(student?.overall_attendance))
          ? Number(student.overall_attendance)
          : 0;

    return {
      key: `${studentId}-${studentRoll}-${studentIndex}`,
      studentId,
      roll: studentRoll,
      name: studentName,
      year,
      program,
      overallAttendance,
      courses,
    };
  });
};

const getOverallFromCourses = (student) => {
  const list = Array.isArray(student?.courses) ? student.courses : [];
  const totalSessions = list.reduce((sum, course) => {
    const total = toNumber(course?.total ?? course?.total_sessions ?? course?.totalClasses);
    return sum + total;
  }, 0);
  const totalAttended = list.reduce((sum, course) => {
    const attended = toNumber(course?.attended ?? course?.present);
    return sum + attended;
  }, 0);

  if (totalSessions > 0) {
    return Math.round((totalAttended / totalSessions) * 1000) / 10;
  }

  return Number.isFinite(Number(student?.overallAttendance))
    ? Number(student.overallAttendance)
    : 0;
};

const normalizeCourseOption = (course) => {
  const code = String(course?.course_code ?? course?.code ?? "").trim();
  const name = String(course?.course_name ?? course?.name ?? "").trim();
  const id = course?.course_id ?? course?.id;

  return {
    id,
    code,
    name,
  };
};

const ViewAttendance = ({ years, batches, programs, courses }) => {
  const [subTab, setSubTab] = useState("individual"); // or "coursewise"
  const [roll, setRoll] = useState("");
  const [year, setYear] = useState("");
  const [program, setProgram] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [coursewiseViewed, setCoursewiseViewed] = useState(false);
  const [coursewiseMessage, setCoursewiseMessage] = useState("");
  const [coursewiseResults, setCoursewiseResults] = useState([]);
  const [coursewiseLoading, setCoursewiseLoading] = useState(false);
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseOptionsLoading, setCourseOptionsLoading] = useState(false);
  const [individualResults, setIndividualResults] = useState([]);
  const [individualSearched, setIndividualSearched] = useState(false);
  const [individualMessage, setIndividualMessage] = useState("");
  const [individualLoading, setIndividualLoading] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const selectedCourseCode = normalizeCourseCode(selectedCourse);
  const yearOptions = (Array.isArray(years) && years.length ? years : batches) || [];
  const fallbackCourses = useMemo(() => {
    return (Array.isArray(courses) ? courses : [])
      .map(normalizeCourseOption)
      .filter((course) => course.code);
  }, [courses]);
  const dropdownCourses = courseOptions.length ? courseOptions : fallbackCourses;

  useEffect(() => {
    const fetchCourses = async () => {
      setCourseOptionsLoading(true);

      try {
        const { data } = await axios.get("/api/courses/");
        const options = (Array.isArray(data) ? data : [])
          .map(normalizeCourseOption)
          .filter((course) => course.code);

        setCourseOptions(options);
      } catch (err) {
        setCourseOptions([]);
      } finally {
        setCourseOptionsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCoursewiseSearch = async () => {
    setCoursewiseViewed(true);

    if (!selectedCourseCode) {
      setCoursewiseResults([]);
      setCoursewiseMessage("Select a course to view attendance.");
      return;
    }

    setCoursewiseLoading(true);
    setCoursewiseMessage("");
    setCoursewiseResults([]);

    try {
      const params = new URLSearchParams();
      // Send only code (not name) as requested.
      params.append("course_code", selectedCourseCode);

      const { data } = await axios.get(`/api/attendance/course/?${params.toString()}`);
      const rows = normalizeApiCoursewiseRows(data, selectedCourseCode);

      setCoursewiseResults(rows);
      if (!rows.length) {
        setCoursewiseMessage("No attendance records found for this course.");
      }
    } catch (err) {
      const apiError = err?.response?.data?.error;
      setCoursewiseResults([]);
      setCoursewiseMessage(apiError || "Failed to fetch course attendance.");
    } finally {
      setCoursewiseLoading(false);
    }
  };

  const handleIndividualSearch = async () => {
    const rollQuery = roll.trim().toLowerCase();
    const yearQuery = year.trim();
    const programQuery = program.trim();

    if (!rollQuery && !yearQuery && !programQuery) {
      setIndividualResults([]);
      setIndividualSearched(true);
      setIndividualMessage("Provide at least one filter: roll no, year, or program.");
      return;
    }

    setIndividualLoading(true);
    setIndividualMessage("");

    try {
      const params = new URLSearchParams();
      if (rollQuery) params.append("student_rollNo", rollQuery);
      if (yearQuery) params.append("year", yearQuery);
      if (programQuery) params.append("program", programQuery);

      const { data } = await axios.get(`/api/attendance/student/?${params.toString()}`);
      const students = normalizeApiIndividualStudents(data);

      setIndividualResults(students);
      setIndividualSearched(true);

      if (!students.length) {
        setIndividualMessage("No attendance records found for the given filters.");
      }
    } catch (err) {
      const apiError = err?.response?.data?.error;
      setIndividualResults([]);
      setIndividualSearched(true);
      setIndividualMessage(apiError || "Failed to fetch attendance records.");
    } finally {
      setIndividualLoading(false);
    }
  };

  return (
    <div className="content-box">
      <div className="section-title">
        <span className="section-title-left">
          <Eye size={20} />
          <span>View Student Attendance</span>
        </span>
      </div>

      <div className="sub-tabs">
       <div className="ind"> <button className={subTab==="individual"?"active":""} onClick={()=>setSubTab("individual")}>Individual Student Search</button></div>
       <div className="course"> <button className={subTab==="coursewise"?"active":""} onClick={()=>setSubTab("coursewise")}>Course-wise Attendance</button></div>
      </div>
      <br />

      {subTab === "individual" && (
        <>
          <div className="filters">
            <input placeholder="Student roll no" value={roll} onChange={(e)=>setRoll(e.target.value)} />
            <select value={year} onChange={(e)=>setYear(e.target.value)}>
              <option value="">All years</option>
              {yearOptions.map(y=> <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={program} onChange={(e)=>setProgram(e.target.value)}>
              <option value="">All programs</option>
              {programs.map(p=> <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" className="primary" onClick={handleIndividualSearch} disabled={individualLoading}>
              {individualLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {!individualSearched && (
            <div className="placeholder">Enter student details and click Search to view attendance records</div>
          )}

          {individualSearched && individualMessage && (
            <div className="placeholder">{individualMessage}</div>
          )}

          {individualSearched && !individualMessage && individualResults.length === 0 && (
            <div className="placeholder">No attendance records found for the given filters.</div>
          )}

          {individualSearched && individualResults.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll No</th><th>Name</th><th>Year</th><th>Program</th><th>Overall Attendance</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {individualResults.map((s, idx) => {
                    const overall = getOverallFromCourses(s);

                    return (
                      <tr key={s.key || `${s.roll}-${idx}`}>
                        <td>{s.roll}</td>
                        <td>{s.name}</td>
                        <td>{s.year}</td>
                        <td>{s.program}</td>
                        <td>
                          <span className={overall >= 85 ? "green-badge" : overall >= 75 ? "yellow-badge" : "red-badge"}>
                            {overall}%
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="primary-outline"
                            onClick={() => {
                              setSelectedStudentDetail(s);
                              setShowStudentDetailModal(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
              {dropdownCourses.map(c => <option key={c.id ?? c.code} value={c.code}>{c.code}{c.name ? ` - ${c.name}` : ""}</option>)}
            </select>
            <button
              className="primary"
              type="button"
              onClick={handleCoursewiseSearch}
              disabled={coursewiseLoading || courseOptionsLoading}
            >
              {coursewiseLoading || courseOptionsLoading ? "Loading..." : "View Attendance"}
            </button>
          </div>

          <h4 className="course-heading">Showing attendance for: {selectedCourseCode ? selectedCourseCode + " - " + (dropdownCourses.find(x=>x.code===selectedCourseCode)?.name || "") : "—"}</h4>

          {coursewiseViewed && coursewiseMessage && (
            <div className="placeholder">{coursewiseMessage}</div>
          )}

          {coursewiseViewed && !coursewiseMessage && selectedCourseCode && coursewiseResults.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th><th>Name</th><th>Batch</th><th>Program</th><th>Total Classes</th><th>Attended</th><th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {coursewiseResults.map((s, idx) => (
                    <tr key={s.key || `${s.roll || "row"}-${idx}`}>
                      <td>{s.roll}</td>
                      <td>{s.name}</td>
                      <td>{s.batch}</td>
                      <td>{s.program}</td>
                      <td>{s.total}</td>
                      <td>{s.attended}</td>
                      <td><span className={s.percent >= 85 ? "green-badge" : s.percent >= 75 ? "yellow-badge" : "red-badge"}>{s.percent}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showStudentDetailModal && selectedStudentDetail && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "980px", width: "95%" }}>
            <div className="modal-header">
              <h3>
                Attendance Details: {selectedStudentDetail.name} ({selectedStudentDetail.roll})
              </h3>
              <span
                className="close-btn"
                onClick={() => {
                  setShowStudentDetailModal(false);
                  setSelectedStudentDetail(null);
                }}
              >
                ✖
              </span>
            </div>

            <div className="modal-content">
              {!selectedStudentDetail.courses?.length ? (
                <div className="placeholder">No course attendance available for this student.</div>
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Course</th><th>Teacher</th><th>Total Sessions</th><th>Attended</th><th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentDetail.courses.map((course) => (
                        <tr key={course.key}>
                          <td>
                            {course.courseCode}
                            {course.courseName && course.courseName !== "-" ? ` - ${course.courseName}` : ""}
                          </td>
                          <td>{course.teacherName}</td>
                          <td>{course.total}</td>
                          <td>{course.attended}</td>
                          <td>
                            <span className={course.percent >= 85 ? "green-badge" : course.percent >= 75 ? "yellow-badge" : "red-badge"}>
                              {course.percent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAttendance;
