import React, { useState } from "react";
import "../../styles/admin.css";
import summaryApi from "../../common/index";

const ManageTeachers = ({ programs = [], years = [] }) => {
  /* ======================
     ADMIN CONTEXT
  ====================== */
  const admin = JSON.parse(localStorage.getItem("currentUser")) || {};

  // ✅ Only programs admin controls
  const adminPrograms =
    Array.isArray(admin.programs) && admin.programs.length
      ? admin.programs
      : programs;

  /* ======================
     LOCAL STORAGE
  ====================== */
  const getTeachers = () =>
    JSON.parse(localStorage.getItem("teachers")) || [];

  const [teachers, setTeachers] = useState(getTeachers());

  /* ======================
     REGISTER FORM
  ====================== */
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    years: "",
    programs: "",
    courses: ""
  });

  /* ======================
     FILTER STATE
  ====================== */
  const [filterYear, setFilterYear] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filteredTeachers, setFilteredTeachers] = useState([]);

  /* ======================
     UPDATE MODAL
  ====================== */
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    id: "",
    courses: ""
  });

  /* ======================
     CSV BULK UPLOAD STATE
  ====================== */
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  /* ======================
     HELPERS
  ====================== */
  const parseCommaList = (value) =>
    value.split(",").map(v => v.trim()).filter(Boolean);

  const parseCourses = (value) =>
    value.split(",").map(c => {
      const [code, name] = c.split(":").map(s => s.trim());
      return { code, name };
    });

  /* ======================
     HANDLERS
  ====================== */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ======================
     REGISTER TEACHER
  ====================== */
  const handleRegister = async () => {
    if (!form.id || !form.name) {
      alert("Teacher ID and Name are required");
      return;
    }

    if (teachers.find(t => t.id === form.id)) {
      alert("Teacher already exists");
      return;
    }

    const newTeacher = {
      id: form.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      years: parseCommaList(form.years),
      programs: parseCommaList(form.programs),
      department: admin.department || "N/A",
      courses: parseCourses(form.courses),
      password: form.id // default password
    };

    // ── Try backend API ──────────────────────────────────────────────
    try {
      const response = await fetch(summaryApi.signUp.url, {
        method: summaryApi.signUp.method.toUpperCase(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "teacher",
          name: form.name,
          email: form.email,
          password: form.id, // default password = teacher ID
          id: form.id,
          phone: form.phone,
          years: form.years,
          programs: form.programs,
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
    const updated = [...teachers, newTeacher];
    localStorage.setItem("teachers", JSON.stringify(updated));
    setTeachers(updated);

    setForm({
      id: "",
      name: "",
      email: "",
      phone: "",
      years: "",
      programs: "",
      courses: ""
    });

    alert(`Teacher Registered\nID: ${newTeacher.id}\nPassword: ${newTeacher.password}`);
  };

  /* ======================
     CSV BULK UPLOAD
  ====================== */
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
      const response = await fetch(summaryApi.bulkUploadTeachers.url, {
        method: summaryApi.bulkUploadTeachers.method.toUpperCase(),
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

  /* ======================
     SEARCH – tries backend, falls back to localStorage
  ====================== */
  const handleSearch = async () => {
    if (!filterYear || !filterProgram) {
      alert("Select Year & Program");
      return;
    }

    // ── Try backend API ──────────────────────────────────────────────
    try {
      const token = localStorage.getItem("accessToken");
      const url = `${summaryApi.teachers.url}?year=${encodeURIComponent(filterYear)}&program=${encodeURIComponent(filterProgram)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Map backend fields to frontend table shape
        const mapped = data.map(t => ({
          id: t.rfid,
          name: t.teacher_name,
          email: t.email || "",
          phone: t.phone || "",
          years: t.years ? t.years.split(",").map(y => y.trim()).filter(Boolean) : [],
          programs: t.programs ? t.programs.split(",").map(p => p.trim()).filter(Boolean) : [],
          department: admin.department || "N/A",
          courses: []
        }));
        setFilteredTeachers(mapped);
        return;
      }
    } catch (_error) { // API unreachable – use offline fallback
      // API unreachable – fall through to localStorage
    }

    // ── Fallback: filter from localStorage ───────────────────────────
    const result = teachers.filter(
      t =>
        t.years.includes(filterYear) &&
        t.programs.includes(filterProgram)
    );
    setFilteredTeachers(result);
  };

  /* ======================
     DELETE
  ====================== */
  const handleDelete = (id) => {
    if (!window.confirm("Delete this teacher?")) return;

    const updated = teachers.filter(t => t.id !== id);
    localStorage.setItem("teachers", JSON.stringify(updated));
    setTeachers(updated);
    setFilteredTeachers(updated);
  };

  /* ======================
     UPDATE COURSES
  ====================== */
  const handleUpdateSubmit = () => {
    const updated = teachers.map(t =>
      t.id === updateForm.id
        ? { ...t, courses: parseCourses(updateForm.courses) }
        : t
    );

    localStorage.setItem("teachers", JSON.stringify(updated));
    setTeachers(updated);
    setShowUpdateModal(false);

    console.log(
      "Updated Teacher:",
      updated.find(t => t.id === updateForm.id)
    );
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="content-box">

      <div className="section-title">
        👩‍🏫 Manage Teachers
        <span className="badge">{teachers.length} Total</span>
      </div>

      {/* REGISTER */}
      <div className="card-inner">
        <h4>Register New Teacher</h4>

        <div className="grid-2">
          <input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} />
          <input name="id" placeholder="Teacher ID *" value={form.id} onChange={handleChange} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />

          <input
            name="years"
            placeholder="Years (e.g. 2021, 2022)"
            value={form.years}
            onChange={handleChange}
          />

          <input
            name="programs"
            placeholder="Programs (e.g. CSIT, AI)"
            value={form.programs}
            onChange={handleChange}
          />

          <input
            name="courses"
            placeholder="Courses (CODE: Name, ...)"
            value={form.courses}
            onChange={handleChange}
          />
        </div>

        <button className="primary" onClick={handleRegister}>
          Register Teacher
        </button>
      </div>

      {/* BULK CSV UPLOAD */}
      <div className="card-inner">
        <h4>Bulk Import Teachers from CSV</h4>
        <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "8px" }}>
          CSV columns: <strong>name, email, id, password</strong> (required) and <em>phone, years, programs, courses</em> (optional).
          Use semicolons to separate multiple courses in the <em>courses</em> column, e.g. <code>CS301: Database; CS401: Algorithms</code>.
          Separate multiple values in <em>years</em> and <em>programs</em> with commas, e.g. <code>1,2,3</code> or <code>CS,IT</code>.
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

      {/* SEARCH */}
      <div className="card-inner small">
        <h4>Search Teachers</h4>

        <div className="filters-inline">
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">Select Year</option>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>

          {/* ✅ ADMIN PROGRAMS ONLY */}
          <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
            <option value="">Select Program</option>
            {adminPrograms.map(p => <option key={p}>{p}</option>)}
          </select>

          <button className="primary-outline" onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* RESULTS */}
        <div className="placeholder">
          {filteredTeachers.length === 0 ? (
            <p>No teachers found.</p>
          ) : (
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Years</th>
                  <th>Programs</th>
                  <th>Department</th>
                  <th>Courses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map(t => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.id}</td>
                    <td>{t.years.join(", ")}</td>
                    <td>{t.programs.join(", ")}</td>
                    <td>{t.department}</td>
                    <td>{t.courses.map(c => c.code).join(", ")}</td>
                    <td>
                      <div className="modify">
                        <button
                          className="update-btn"
                          onClick={() => {
                            setUpdateForm({
                              id: t.id,
                              courses: t.courses
                                .map(c => `${c.code}: ${c.name}`)
                                .join(", ")
                            });
                            setShowUpdateModal(true);
                          }}
                        >
                          Update
                        </button>

                        <button
                          className="del-btn"
                          onClick={() => handleDelete(t.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Update Courses</h3>
            <input
              value={updateForm.courses}
              onChange={e =>
                setUpdateForm({ ...updateForm, courses: e.target.value })
              }
              placeholder="CODE: Name, ..."
            />
            <div className="modal-actions">
              <button onClick={() => setShowUpdateModal(false)}>Cancel</button>
              <button onClick={handleUpdateSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageTeachers;
