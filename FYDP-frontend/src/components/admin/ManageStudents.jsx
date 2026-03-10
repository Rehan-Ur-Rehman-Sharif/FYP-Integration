import React, { useState, useEffect } from "react";
import "../../styles/admin.css";
import summaryApi from "../../common/index";

const ManageStudents = ({ years, programs, onRegister }) => {
  // Form for new student registration
  const [form, setForm] = useState({
    name: "",
    id: "",
    year: "",
    program: "",
    email: "",
    password: "",
    courses: ""
  });

  const [filterYear, setFilterYear] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    id: "",
    courses: ""
  });

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    year: "",
    batch: "",
    courses: ""
  });

  // State for CSV bulk upload
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  // 🔹 Read students from localStorage
  const allStudents = JSON.parse(localStorage.getItem("students")) || [];

  // Handle form input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdateChange = (e) => {
    setUpdateForm({ ...updateForm, [e.target.name]: e.target.value });
  };

  const handleBulkChange = (e) => {
    setBulkForm({ ...bulkForm, [e.target.name]: e.target.value });
  };

  // Register new student – tries backend API, falls back to localStorage
  const handleSubmit = async () => {
    if (!form.name || !form.id) {
      alert("Name and ID are required");
      return;
    }

    const parsedCourses = form.courses
      .split(",")
      .map(c => {
        const [code, name] = c.split(":").map(s => s.trim());
        return { code, name };
      });

    const newStudent = { ...form, courses: parsedCourses };

    // ── Try backend API ──────────────────────────────────────────────
    try {
      const response = await fetch(summaryApi.signUp.url, {
        method: summaryApi.signUp.method.toUpperCase(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "student",
          name: form.name,
          email: form.email,
          password: form.password,
          id: form.id,
          year: form.year,
          program: form.program,
          courses: form.courses,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(`Registration failed: ${err.error || response.statusText}`);
        return;
      }
    } catch (_error) { // API unreachable – use offline fallback
      // API unreachable – fall through to localStorage only
    }

    // ── Always persist locally (offline support / static dev) ────────
    const updatedStudents = [...allStudents, newStudent];
    localStorage.setItem("students", JSON.stringify(updatedStudents));

    setForm({
      name: "",
      id: "",
      year: "",
      program: "",
      email: "",
      password: "",
      courses: ""
    });
  };

  // Delete a student
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    const updatedStudents = allStudents.filter(s => s.id !== id);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    setFilteredStudents(updatedStudents);
  };

  // Update courses for individual student
  const handleUpdateSubmit = () => {
    const updatedStudents = allStudents.map(s => {
      if (s.id === updateForm.id) {
        return {
          ...s,
          courses: updateForm.courses
            .split(",")
            .map(c => {
              const [code, name] = c.split(":").map(s => s.trim());
              return { code, name };
            })
        };
      }
      return s;
    });

    localStorage.setItem("students", JSON.stringify(updatedStudents));
    console.log(
      updatedStudents.find(s => s.id === updateForm.id)
    );

    setShowUpdateModal(false);
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

  // Bulk CSV upload – sends file to backend
  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert("Please select a CSV file first.");
      return;
    }
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("file", csvFile);
      const response = await fetch(summaryApi.bulkUploadStudents.url, {
        method: summaryApi.bulkUploadStudents.method.toUpperCase(),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setCsvResult(data);
      } else {
        alert(`Upload failed: ${data.error || response.statusText}`);
      }
    } catch (_error) {
      alert("Could not reach the server. Please try again.");
    } finally {
      setCsvUploading(false);
      setCsvFile(null);
    }
  };

  // Filter students by year & program – tries backend, falls back to localStorage
  const handleFilter = async () => {
    if (!filterYear || !filterProgram) {
      alert("Please select both Year and Program");
      return;
    }

    // ── Try backend API ──────────────────────────────────────────────
    try {
      const token = localStorage.getItem("accessToken");
      const url = `${summaryApi.students.url}?year=${encodeURIComponent(filterYear)}&program=${encodeURIComponent(filterProgram)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend fields to the frontend table shape
        const mapped = data.map(s => ({
          id: s.rfid,
          name: s.student_name,
          year: String(s.year),
          program: s.program || s.dept,
          email: s.email || "",
          courses: [] // courses are managed separately in the backend
        }));
        setFilteredStudents(mapped);
        return;
      }
    } catch (_error) { // API unreachable – use offline fallback
      // API unreachable – fall through to localStorage
    }

    // ── Fallback: filter from localStorage ───────────────────────────
    const result = allStudents.filter(
      s => s.year === filterYear && s.program === filterProgram
    );
    setFilteredStudents(result);
  };

  return (
    <div className="content-box">

      {/* HEADER */}
      <div className="section-title">
        🧑‍🎓 Manage Students
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
          <input name="id" placeholder="ID *" value={form.id} onChange={handleChange} />
          <input name="year" placeholder="Year *" value={form.year} onChange={handleChange} />
          <input name="program" placeholder="Program *" value={form.program} onChange={handleChange} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <input name="courses" placeholder="Courses (CODE: Name, ...)" value={form.courses} onChange={handleChange} />
        </div>
        <button className="primary" onClick={handleSubmit}>Register Student</button>
      </div>

      {/* BULK CSV UPLOAD */}
      <div className="card-inner">
        <h4>Bulk Import Students from CSV</h4>
        <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "8px" }}>
          CSV columns: <strong>name, email, id, password</strong> (required) and <em>year, program, section, courses</em> (optional).
          Use semicolons to separate multiple courses in the <em>courses</em> column, e.g. <code>CS301: Database; CS401: Algorithms</code>.
        </p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => { setCsvFile(e.target.files[0]); setCsvResult(null); }}
          />
          <button className="primary" onClick={handleCsvUpload} disabled={csvUploading}>
            {csvUploading ? "Uploading…" : "Upload CSV"}
          </button>
        </div>
        {csvResult && (
          <div style={{ marginTop: "10px", padding: "10px", background: "#f4f4f4", borderRadius: "6px" }}>
            <strong>Upload complete:</strong> {csvResult.success} succeeded, {csvResult.errors} failed out of {csvResult.total}.
            {csvResult.errors > 0 && (
              <ul style={{ marginTop: "6px", fontSize: "0.82rem", color: "#c0392b" }}>
                {csvResult.results.filter(r => r.status === "error").map(r => (
                  <li key={r.row}>Row {r.row} ({r.name || r.email}): {r.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
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
              <input
                name="courses"
                placeholder="Courses (CODE: Name, ...)"
                value={updateForm.courses}
                onChange={handleUpdateChange}
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowUpdateModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleUpdateSubmit}>Submit</button>
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
          <button className="primary-outline" onClick={handleFilter}>View Students</button>
        </div>

        <div className="placeholder">
          {filteredStudents.length === 0 ? (
            <p>No students found for selected filters.</p>
          ) : (
            <table className="simple-table">
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
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.id}</td>
                    <td>{s.year}</td>
                    <td>{s.program}</td>
                    <td>{s.email || "-"}</td>
                    <td>{s.courses?.map(c => c.code).join(", ")}</td>
                    <td>
                      <div className="modify">
                        <button className="update-btn" onClick={() => {setUpdateForm({ id: s.id, courses: s.courses.map(c => c.code + ": " + c.name).join(", ") }); setShowUpdateModal(true);}}>Update</button>
                        <button className="del-btn" onClick={() => handleDelete(s.id)}>Delete</button>
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

  // Delete a student
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    const updatedStudents = allStudents.filter(s => s.id !== id);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    setFilteredStudents(updatedStudents);
  };

  // Update courses for individual student
  const handleUpdateSubmit = () => {
    const updatedStudents = allStudents.map(s => {
      if (s.id === updateForm.id) {
        return {
          ...s,
          courses: updateForm.courses
            .split(",")
            .map(c => {
              const [code, name] = c.split(":").map(s => s.trim());
              return { code, name };
            })
        };
      }
      return s;
    });

    localStorage.setItem("students", JSON.stringify(updatedStudents));
    console.log(
      updatedStudents.find(s => s.id === updateForm.id)
    );

    setShowUpdateModal(false);
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

  // Filter students by year & program – tries backend, falls back to localStorage
  const handleFilter = async () => {
    if (!filterYear || !filterProgram) {
      alert("Please select both Year and Program");
      return;
    }

    // ── Try backend API ──────────────────────────────────────────────
    try {
      const token = localStorage.getItem("accessToken");
      const url = `${summaryApi.students.url}?year=${encodeURIComponent(filterYear)}&program=${encodeURIComponent(filterProgram)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend fields to the frontend table shape
        const mapped = data.map(s => ({
          id: s.rfid,
          name: s.student_name,
          year: String(s.year),
          program: s.program || s.dept,
          email: s.email || "",
          courses: [] // courses are managed separately in the backend
        }));
        setFilteredStudents(mapped);
        return;
      }
    } catch (_error) { // API unreachable – use offline fallback
      // API unreachable – fall through to localStorage
    }

    // ── Fallback: filter from localStorage ───────────────────────────
    const result = allStudents.filter(
      s => s.year === filterYear && s.program === filterProgram
    );
    setFilteredStudents(result);
  };

  return (
    <div className="content-box">

      {/* HEADER */}
      <div className="section-title">
        🧑‍🎓 Manage Students
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
          <input name="id" placeholder="ID *" value={form.id} onChange={handleChange} />
          <input name="year" placeholder="Year *" value={form.year} onChange={handleChange} />
          <input name="program" placeholder="Program *" value={form.program} onChange={handleChange} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <input name="courses" placeholder="Courses (CODE: Name, ...)" value={form.courses} onChange={handleChange} />
        </div>
        <button className="primary" onClick={handleSubmit}>Register Student</button>
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
              <input
                name="courses"
                placeholder="Courses (CODE: Name, ...)"
                value={updateForm.courses}
                onChange={handleUpdateChange}
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowUpdateModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleUpdateSubmit}>Submit</button>
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
          <button className="primary-outline" onClick={handleFilter}>View Students</button>
        </div>

        <div className="placeholder">
          {filteredStudents.length === 0 ? (
            <p>No students found for selected filters.</p>
          ) : (
            <table className="simple-table">
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
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.id}</td>
                    <td>{s.year}</td>
                    <td>{s.program}</td>
                    <td>{s.email || "-"}</td>
                    <td>{s.courses?.map(c => c.code).join(", ")}</td>
                    <td>
                      <div className="modify">
                        <button className="update-btn" onClick={() => {setUpdateForm({ id: s.id, courses: s.courses.map(c => c.code + ": " + c.name).join(", ") }); setShowUpdateModal(true);}}>Update</button>
                        <button className="del-btn" onClick={() => handleDelete(s.id)}>Delete</button>
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
