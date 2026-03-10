import React, { useState } from "react";
import "../../styles/admin.css";
import summaryApi from "../../common/index";

const ManageCourses = () => {
  /* ======================
     MANUAL ADD FORM
  ====================== */
  const [form, setForm] = useState({ course_code: "", course_name: "" });
  const [addResult, setAddResult] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddCourse = async () => {
    if (!form.course_name.trim()) {
      alert("Course name is required.");
      return;
    }
    setAddLoading(true);
    setAddResult(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(summaryApi.courses.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          course_code: form.course_code.trim(),
          course_name: form.course_name.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok || response.status === 201) {
        setAddResult({ ok: true, message: `Course "${data.course_name || form.course_name}" added (ID: ${data.course_id}).` });
        setForm({ course_code: "", course_name: "" });
      } else {
        setAddResult({ ok: false, message: data.error || data.course_name?.[0] || response.statusText });
      }
    } catch (_err) {
      setAddResult({ ok: false, message: "An error occurred. Please try again." });
    } finally {
      setAddLoading(false);
    }
  };

  /* ======================
     CSV BULK UPLOAD
  ====================== */
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

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
      const response = await fetch(summaryApi.bulkUploadCourses.url, {
        method: summaryApi.bulkUploadCourses.method.toUpperCase(),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setCsvResult(data);
      } else {
        alert(`Upload failed: ${data.error || response.statusText}`);
      }
    } catch (_err) {
      alert("An error occurred during upload. Please try again.");
    } finally {
      setCsvUploading(false);
      setCsvFile(null);
    }
  };

  return (
    <div className="content-box">

      <div className="section-title">
        📚 Manage Courses
      </div>

      {/* MANUAL ADD */}
      <div className="card-inner">
        <h4>Add New Course</h4>
        <div className="grid-2">
          <input
            name="course_code"
            placeholder="Course Code (e.g. CS301)"
            value={form.course_code}
            onChange={handleChange}
          />
          <input
            name="course_name"
            placeholder="Course Name * (e.g. Database Systems)"
            value={form.course_name}
            onChange={handleChange}
          />
        </div>
        <button className="primary" onClick={handleAddCourse} disabled={addLoading}>
          {addLoading ? "Adding…" : "Add Course"}
        </button>
        {addResult && (
          <p style={{ marginTop: "8px", color: addResult.ok ? "#27ae60" : "#c0392b", fontSize: "0.9rem" }}>
            {addResult.message}
          </p>
        )}
      </div>

      {/* BULK CSV UPLOAD */}
      <div className="card-inner">
        <h4>Bulk Import Courses from CSV</h4>
        <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "8px" }}>
          CSV columns: <strong>course_name</strong> (required) and <em>course_code</em> (optional).
          Rows whose course code already exists in the database are skipped automatically.
          Example row: <code>CS301,Database Systems</code>
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
            <strong>Upload complete:</strong>{" "}
            {csvResult.success} added, {csvResult.skipped} skipped, {csvResult.errors} failed
            {" "}out of {csvResult.total}.
            {csvResult.errors > 0 && (
              <ul style={{ marginTop: "6px", fontSize: "0.82rem", color: "#c0392b" }}>
                {csvResult.results
                  .filter(r => r.status === "error")
                  .map(r => (
                    <li key={r.row}>Row {r.row} ({r.course_name || r.course_code}): {r.error}</li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ManageCourses;
