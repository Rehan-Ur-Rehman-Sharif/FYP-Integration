import React, { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import axios from "../../utils/axiosInstance";
import "../../styles/admin.css";

const ManageStudents = ({ years, programs, onRegister }) => {
  const createEmptyCourseEntry = () => ({
    courseCode: "",
  });

  const normalizeCourseCodesInput = (value) =>
    (value || "")
      .toUpperCase()
      .replace(/\s*,\s*/g, ", ")
      .replace(/^,|,$/g, "")
      .replace(/\s{2,}/g, " ");

  const parseCourseCodes = (value) =>
    (value || "")
      .split(",")
      .map(code => code.trim().toUpperCase())
      .filter(Boolean);

  // Form for new student registration
  const [form, setForm] = useState({
    name: "",
    id: "",
    year: "",
    program: "",
    section: "",
    email: "",
    password: "",
    courses: ""
  });

  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [filterYear, setFilterYear] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    id: "",
    courses: [createEmptyCourseEntry()]
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    year: "",
    batch: "",
    courses: ""
  });

  // 🔹 Read students from localStorage
  const allStudents = JSON.parse(localStorage.getItem("students")) || [];

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "courses" ? normalizeCourseCodesInput(value) : value;
    setForm({ ...form, [name]: nextValue });
  };

  const updateCourseList = (index, field, value) => {
    setUpdateForm(prev => ({
      ...prev,
      courses: prev.courses.map((course, courseIndex) =>
        courseIndex === index ? { ...course, [field]: value } : course
      ),
    }));
  };

  const addUpdateCourseField = () => {
    setUpdateForm(prev => ({
      ...prev,
      courses: [...prev.courses, createEmptyCourseEntry()],
    }));
  };

  const removeUpdateCourseField = (index) => {
    setUpdateForm(prev => {
      const nextCourses = prev.courses.filter((_, courseIndex) => courseIndex !== index);
      return {
        ...prev,
        courses: nextCourses.length ? nextCourses : [createEmptyCourseEntry()],
      };
    });
  };

  const handleBulkChange = (e) => {
    setBulkForm({ ...bulkForm, [e.target.name]: e.target.value });
  };

  // Register new student via API
  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setRegisterError("Name, Email, and Password are required");
      return;
    }

    const courseCodes = parseCourseCodes(form.courses);
    if (!courseCodes.length) {
      setRegisterError("Enter at least one course code (e.g. CS101, CS102).");
      return;
    }

    setLoading(true);
    setRegisterError("");

    try {
      const payload = {
        role: "student",
        name: form.name,
        email: form.email,
        password: form.password,
        ...(form.id && { id: form.id }),
        ...(form.year && { year: Number.isNaN(Number(form.year)) ? form.year : Number(form.year) }),
        ...(form.program && { program: form.program }),
        ...(form.section && { section: form.section }),
        courses: courseCodes,
      };

      const { data } = await axios.post("/api/signup", payload);

      alert(`Student "${data.name}" registered successfully!`);
      setForm({ name: "", id: "", year: "", program: "", section: "", email: "", password: "", courses: "" });
      if (onRegister) onRegister(data);
    } catch (err) {
      const message = err.response?.data?.message || "Network error. Please try again.";
      setRegisterError(message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a student
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await axios.delete(`/api/students/${id}/`);
      setFilteredStudents(prev => prev.filter(s => (s.student_id || s.id) !== id));
      alert("Student deleted successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const normalizeCourseForUpdate = (course) => {
    if (typeof course === "string") {
      return {
        courseCode: course.toUpperCase(),
      };
    }

    return {
      courseCode: String(course?.course_code ?? course?.code ?? "").toUpperCase(),
    };
  };

  const getCoursesForUpdate = (courses) => {
    if (!Array.isArray(courses) || !courses.length) {
      return [createEmptyCourseEntry()];
    }

    const normalized = courses
      .map(course => normalizeCourseForUpdate(course))
      .filter(course =>
        String(course.courseCode ?? "").trim()
      );

    return normalized.length ? normalized : [createEmptyCourseEntry()];
  };

  const buildStudentCourseCodes = (courses) => {
    const codes = (Array.isArray(courses) ? courses : [])
      .map(course => String(course?.courseCode || "").trim().toUpperCase())
      .filter(Boolean);

    return [...new Set(codes)];
  };

  const validateStudentCourseCodes = (courses) => {
    const relevantRows = (Array.isArray(courses) ? courses : []).filter(course =>
      String(course?.courseCode || "").trim()
    );

    if (!relevantRows.length) return "Add at least one course.";

    return "";
  };

  // Update courses for individual student via API
  const handleUpdateSubmit = async () => {
    const courseError = validateStudentCourseCodes(updateForm.courses);
    if (courseError) {
      setUpdateError(courseError);
      return;
    }

    setUpdateLoading(true);
    setUpdateError("");

    try {
      const courseCodes = buildStudentCourseCodes(updateForm.courses);
      const { data } = await axios.patch(`/api/students/${updateForm.id}/update-courses/`, {
        courses: courseCodes,
      });

      const nextCourses = Array.isArray(data?.courses) ? data.courses : courseCodes;

      setFilteredStudents(prev =>
        prev.map(s =>
          (s.student_id || s.id) === updateForm.id
            ? { ...s, courses: nextCourses }
            : s
        )
      );

      const skippedCourses = Array.isArray(data?.skipped_courses) ? data.skipped_courses : [];
      if (skippedCourses.length) {
        const skippedCodes = skippedCourses
          .map(item => item?.course_code)
          .filter(Boolean)
          .join(", ");
        alert(`${data?.message || "Courses updated successfully."}\nSkipped: ${skippedCodes || skippedCourses.length}`);
      } else {
        alert(data?.message || "Courses updated successfully.");
      }
      setShowUpdateModal(false);
    } catch (err) {
      setUpdateError(err.response?.data?.message || "Failed to update courses.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Bulk update courses for a year & batch
  const handleBulkSubmit = () => {
    if (!bulkForm.year || !bulkForm.batch || !bulkForm.courses) {
      alert("Fill all fields for bulk update");
      return;
    }

    const courses = bulkForm.courses.split(",").map(c => {
      const [code, name] = c.split(":").map(s => s.trim());
      return { code, name };
    });

    const updatedStudents = allStudents.map(s =>
      s.year === bulkForm.year && s.program === bulkForm.batch
        ? { ...s, courses }
        : s
    );

    localStorage.setItem("students", JSON.stringify(updatedStudents));
    console.log("Bulk update applied:", updatedStudents.filter(
      s => s.year === bulkForm.year && s.program === bulkForm.batch
    ));

    setShowBulkModal(false);
  };

  // Filter students via API
  const handleFilter = async () => {
    if (!filterYear && !filterProgram) {
      setFilterError("Please select at least Year or Program");
      return;
    }

    setFilterLoading(true);
    setFilterError("");
    setFilteredStudents([]);

    try {
      const params = new URLSearchParams();
      if (filterYear) params.append("year", filterYear);
      if (filterProgram) params.append("program", filterProgram);

      const { data } = await axios.get(`/api/students/?${params.toString()}`);

      console.log("Students API response:", data);
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setFilteredStudents(list);
      if (data.length === 0) setFilterError("No students found for selected filters.");
    } catch (err) {
      setFilterError(err.response?.data?.message || "Failed to fetch students.");
    } finally {
      setFilterLoading(false);
    }
  };

  return (
    <div className="content-box">

      {/* HEADER */}
      <div className="section-title">
        <span className="section-title-left">
          <GraduationCap size={20} />
          <span>Manage Students</span>
        </span>
        <span className="badge">{allStudents.length} Total Students</span>
      </div>

      {/* REGISTER & BULK UPDATE BUTTONS */}
      <div style={{ marginBottom: "15px" }}>
        <button className="primary" onClick={() => setShowBulkModal(true)}>
          Update Courses (Bulk)
        </button>
      </div>

      {/* REGISTER STUDENT */}
      <div className="card-inner">
        <h4>Register New Student</h4>
        <div className="grid-2">
          <input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} />
          <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange} />
          <input name="id" placeholder="Roll No / RFID" value={form.id} onChange={handleChange} />
          <input name="year" placeholder="Year (e.g. 2)" value={form.year} onChange={handleChange} />
          <input name="program" placeholder="Program / Department" value={form.program} onChange={handleChange} />
          <input name="section" placeholder="Section (default: A)" value={form.section} onChange={handleChange} />
          <input name="courses" placeholder="Courses (e.g. CS101, CS102)" value={form.courses} onChange={handleChange} />
        </div>
        {registerError && <p style={{ color: "red", marginBottom: "8px" }}>{registerError}</p>}
        <button className="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Registering..." : "Register Student"}
        </button>
      </div>

      {/* BULK UPDATE MODAL */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Bulk Update Courses</h3>
              <span className="close-btn" onClick={() => setShowBulkModal(false)}>✖</span>
            </div>
            <div className="modal-content">
              <input
                name="year"
                placeholder="Year"
                value={bulkForm.year}
                onChange={handleBulkChange}
              />
              <input
                name="batch"
                placeholder="Batch / Program"
                value={bulkForm.batch}
                onChange={handleBulkChange}
              />
              <input
                name="courses"
                placeholder="Courses (CODE: Name, ...)"
                value={bulkForm.courses}
                onChange={handleBulkChange}
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleBulkSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE INDIVIDUAL MODAL */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Update Student Courses</h3>
              <span className="close-btn" onClick={() => setShowUpdateModal(false)}>✖</span>
            </div>
            <div className="modal-content">
              <div style={{ display: "grid", gap: "12px", maxHeight: "45vh", overflowY: "auto", paddingRight: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span>Edit allotted courses</span>
                  <button type="button" className="primary-outline" onClick={addUpdateCourseField}>Add Course</button>
                </div>

                {updateForm.courses.map((course, index) => (
                  <div
                    key={`student-update-course-${index}`}
                    style={{
                      border: "1px solid #d9e2f2",
                      borderRadius: "12px",
                      padding: "14px",
                      display: "grid",
                      gap: "12px",
                      background: "#f8fbff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <strong>Course {index + 1}</strong>
                      <button type="button" className="del-btn" onClick={() => removeUpdateCourseField(index)}>Remove</button>
                    </div>
                    <div className="grid-2">
                      <input
                        placeholder="Course Code"
                        value={course.courseCode}
                        onChange={e => updateCourseList(index, "courseCode", e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {updateError && <p style={{ color: "red", marginTop: "8px" }}>{updateError}</p>}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowUpdateModal(false); setUpdateError(""); }}>Cancel</button>
              <button className="submit-btn" onClick={handleUpdateSubmit} disabled={updateLoading}>
                {updateLoading ? "Updating..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & VIEW STUDENTS */}
      <div className="card-inner small">
        <h4>View Students by Year and Program</h4>
        <div className="filters-inline">
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">Select Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
            <option value="">Select Program</option>
            {programs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="primary-outline" onClick={handleFilter} disabled={filterLoading}>
            {filterLoading ? "Searching..." : "View Students"}
          </button>
        </div>

        {filterError && <p style={{ color: "red", margin: "8px 0" }}>{filterError}</p>}

        <div className="placeholder">
          {filteredStudents.length === 0 ? (
            !filterError && <p>Use the filters above to search students.</p>
          ) : (
            <table className="simple-table student-search-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Year</th>
                  <th>Program</th>
                  <th>Email</th>
                  <th>Courses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.student_id || s.id}>
                    <td>{s.name || s.full_name || s.student_name || "-"}</td>
                    <td>{s.roll_no || s.rfid || s.student_id || s.id || "-"}</td>
                    <td>{s.year || "-"}</td>
                    <td>{s.program || s.programs || s.department || s.dept || "-"}</td>
                    <td>{s.email || "-"}</td>
                    <td>
                      {Array.isArray(s.courses) && s.courses.length > 0
                        ? s.courses.map(c =>
                            typeof c === "string"
                              ? c
                              : (c.course_code || c.code || c.course_name || c.name || JSON.stringify(c))
                          ).join(", ")
                        : s.courses || "-"}
                    </td>
                    <td>
                      <div className="modify">
                        <button className="update-btn" onClick={() => { setUpdateForm({ id: s.student_id || s.id, courses: getCoursesForUpdate(s.courses) }); setUpdateError(""); setShowUpdateModal(true); }}>Update</button>
                        <button className="del-btn" onClick={() => handleDelete(s.student_id || s.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default ManageStudents;
