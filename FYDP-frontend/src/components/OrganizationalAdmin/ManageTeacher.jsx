import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import axios from "../../utils/axiosInstance";
import "../../styles/admin.css";

const createEmptyCourse = () => ({
  courseId: "",
  courseName: "",
  courseCode: "",
  year: "",
  dept: "",
  section: "",
});

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
  const filterProgramOptions = Array.isArray(programs) && programs.length ? programs : adminPrograms;

  /* ======================
     HELPERS
  ====================== */
  const parseCommaList = (value) => {
    if (typeof value !== "string") return [];
    return value.split(",").map(v => v.trim()).filter(Boolean);
  };

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return parseCommaList(value);
    if (value == null) return [];
    return [String(value).trim()].filter(Boolean);
  };

  const normalizeCourse = (course) => {
    if (typeof course === "string") {
      return {
        courseId: "",
        courseName: "",
        courseCode: course.trim(),
        year: "",
        dept: "",
        section: "",
      };
    }

    return {
      courseId: course?.course_id ?? course?.id ?? "",
      courseName: course?.course_name ?? course?.courseName ?? course?.name ?? "",
      courseCode: course?.course_code ?? course?.courseCode ?? course?.code ?? "",
      year: course?.year ?? course?.batch ?? course?.years?.[0] ?? "",
      dept: course?.dept ?? course?.department ?? course?.program ?? course?.programs?.[0] ?? "",
      section: course?.section ?? course?.sections?.[0] ?? "",
    };
  };

  const expandCourseAssignments = (courses) => {
    if (!Array.isArray(courses)) return [];

    return courses.flatMap(rawCourse => {
      const sections = Array.isArray(rawCourse?.sections)
        ? rawCourse.sections
        : [rawCourse?.section ?? ""];
      const yearsList = Array.isArray(rawCourse?.years)
        ? rawCourse.years
        : [rawCourse?.year ?? rawCourse?.batch ?? ""];
      const programsList = Array.isArray(rawCourse?.programs)
        ? rawCourse.programs
        : [rawCourse?.program ?? rawCourse?.dept ?? rawCourse?.department ?? ""];
      const rowCount = Math.max(sections.length, yearsList.length, programsList.length, 1);

      return Array.from({ length: rowCount }, (_, index) =>
        normalizeCourse({
          ...rawCourse,
          section: sections[index] ?? sections[0] ?? "",
          year: yearsList[index] ?? yearsList[0] ?? "",
          program: programsList[index] ?? programsList[0] ?? "",
        })
      );
    });
  };

  const hasCourseValue = (course) =>
    Object.values(course).some(value => String(value ?? "").trim());

  const isCourseComplete = (course) =>
    [course.courseName, course.courseCode, course.year, course.dept, course.section]
      .every(value => String(value ?? "").trim());

  const sanitizeCourses = (courses) =>
    (Array.isArray(courses) ? courses : [])
      .map(normalizeCourse)
      .filter(hasCourseValue)
      .map(course => ({
        ...(String(course.courseId ?? "").trim() && {
          course_id: Number.isNaN(Number(course.courseId))
            ? String(course.courseId).trim()
            : Number(course.courseId),
        }),
        course_name: course.courseName.trim(),
        course_code: course.courseCode.trim(),
        year: Number.isNaN(Number(course.year)) ? course.year.trim() : Number(course.year),
        program: course.dept.trim(),
        section: course.section.trim(),
      }));

  const deriveTeacherMeta = (courses) => {
    const yearsList = [...new Set(courses.map(course => course.year).filter(Boolean))];
    const departments = [...new Set(courses.map(course => course.dept || course.department).filter(Boolean))];
    const sections = [...new Set(courses.map(course => course.section).filter(Boolean))];

    return {
      years: yearsList,
      departments,
      sections,
      department: departments.join(", ") || "N/A",
    };
  };

  const validateCourseEntries = (courses) => {
    const relevantCourses = (Array.isArray(courses) ? courses : []).filter(hasCourseValue);

    if (!relevantCourses.length) {
      return "Add at least one allotted course.";
    }

    if (relevantCourses.some(course => !isCourseComplete(course))) {
      return "Each allotted course needs course name, code, year, dept, and section.";
    }

    return "";
  };

  const validateSyncCourseEntries = (courses) => {
    const relevantCourses = (Array.isArray(courses) ? courses : []).filter(hasCourseValue);

    if (!relevantCourses.length) {
      return "Add at least one allotted course.";
    }

    const hasInvalid = relevantCourses.some(course => {
      const normalized = normalizeCourse(course);
      const hasCode = String(normalized.courseCode || "").trim();
      const hasSection = String(normalized.section || "").trim();
      const hasYear = String(normalized.year || "").trim();
      return !hasCode || !hasSection || !hasYear;
    });

    if (hasInvalid) {
      return "Each course needs course code, section, and year for sync.";
    }

    return "";
  };

  const buildSyncCoursesPayload = (courses) =>
    (Array.isArray(courses) ? courses : [])
      .map(normalizeCourse)
      .filter(hasCourseValue)
      .map(course => {
        const code = String(course.courseCode || "").trim().toUpperCase();
        const name = String(course.courseName || "").trim();
        const section = String(course.section || "").trim().toUpperCase();
        const yearValue = String(course.year || "").trim();

        return {
          course_code: code,
          ...(name && { course_name: name }),
          section,
          year: Number.isNaN(Number(yearValue)) ? yearValue : Number(yearValue),
        };
      })
      .filter(course => course.course_code && course.section && String(course.year).trim());

  const formatCourseSummary = (courses) => {
    if (!Array.isArray(courses) || !courses.length) return "-";

    const summary = courses
      .map(rawCourse => {
        const course = normalizeCourse(rawCourse);
        const code = String(course.courseCode || "").trim();
        const name = String(course.courseName || "").trim();
        if (code && name) return `${code}: ${name}`;
        return code || name;
      })
      .filter(Boolean)
      .join(", ");

    return summary || "-";
  };

  const normalizeTeacher = (t) => {
    if (!t || typeof t !== "object") return null;

    // Seed format from TeacherData.js
    if (t.profile && typeof t.profile === "object") {
      const teacherId = t.profile.teacherId ?? "";
      const teacherName = t.profile.name ?? "";
      const teacherDepartment = t.profile.department ?? t.department ?? t.dept ?? "N/A";
      const teacherYears = Array.isArray(t.years)
        ? t.years
        : Array.isArray(t.batches)
          ? t.batches
          : [];
      const teacherPrograms = Array.isArray(t.programs) ? t.programs : [];
      const teacherCourses = Array.isArray(t.courses)
        ? expandCourseAssignments(t.courses)
        : Array.isArray(t.profile.coursesTeaching)
          ? t.profile.coursesTeaching.map(code => normalizeCourse({ code }))
          : [];
      const derivedMeta = deriveTeacherMeta(teacherCourses);

      return {
        id: teacherId,
        rollNo: t.profile.teacherId ?? t.teacher_rollNo ?? t.teacherRollNo ?? "",
        name: teacherName,
        email: t.profile.email ?? t.email ?? "",
        phone: t.profile.phone ?? t.phone ?? "",
        years: derivedMeta.years.length ? derivedMeta.years : teacherYears,
        programs: derivedMeta.departments.length ? derivedMeta.departments : teacherPrograms,
        department: teacherDepartment !== "N/A" ? teacherDepartment : derivedMeta.department,
        sections: derivedMeta.sections,
        courses: teacherCourses,
        password: t.profile.password ?? t.password,
      };
    }

    // Flat format used by ManageTeachers register UI (or legacy login code)
    const normalizedYears = Array.isArray(t.years)
      ? t.years
      : Array.isArray(t.batches)
        ? t.batches
        : parseCommaList(t.years);
    const normalizedPrograms = toArray(t.programs || t.program || t.department || t.dept);
    const normalizedCourses = Array.isArray(t.courses)
      ? expandCourseAssignments(t.courses)
      : typeof t.courses === "string"
        ? t.courses
            .split(",")
            .map(code => normalizeCourse({ code: code.trim() }))
            .filter(course => course.courseCode)
        : [];
    const derivedMeta = deriveTeacherMeta(normalizedCourses);

    return {
      id: t.id ?? t.teacher_id ?? t.teacherId ?? "",
      rollNo: t.teacher_rollNo ?? t.teacherRollNo ?? t.rollNo ?? t.roll_no ?? "",
      name: t.name ?? t.teacher_name ?? t.full_name ?? "",
      email: t.email ?? t.teacher_email ?? "",
      phone: t.phone ?? t.teacher_phone ?? "",
      years: derivedMeta.years.length ? derivedMeta.years : normalizedYears,
      programs: derivedMeta.departments.length ? derivedMeta.departments : normalizedPrograms,
      department:
        t.department ??
        t.dept ??
        (normalizedPrograms.length ? normalizedPrograms.join(", ") : derivedMeta.department),
      sections: derivedMeta.sections,
      courses: normalizedCourses,
      password: t.password,
    };
  };

  /* ======================
     LOCAL STORAGE
  ====================== */
  const getTeachers = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem("teachers"));
      const list = Array.isArray(parsed) ? parsed : [];
      return list.map(normalizeTeacher).filter(Boolean);
    } catch {
      return [];
    }
  };

  const [teachers, setTeachers] = useState(getTeachers());

  /* ======================
     REGISTER FORM
  ====================== */
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    courses: [createEmptyCourse()]
  });

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  /* ======================
     FILTER STATE
  ====================== */
  const [filterYear, setFilterYear] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState("");

  /* ======================
     UPDATE MODAL
  ====================== */
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    id: "",
    courses: [createEmptyCourse()]
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  /* ======================
     HANDLERS
  ====================== */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const updateCourseList = (setter, key, index, field, value) => {
    setter(prev => ({
      ...prev,
      [key]: prev[key].map((course, courseIndex) =>
        courseIndex === index ? { ...course, [field]: value } : course
      ),
    }));
  };

  const addCourseField = (setter, key) => {
    setter(prev => ({
      ...prev,
      [key]: [...prev[key], createEmptyCourse()],
    }));
  };

  const removeCourseField = (setter, key, index) => {
    setter(prev => {
      const nextCourses = prev[key].filter((_, courseIndex) => courseIndex !== index);
      return {
        ...prev,
        [key]: nextCourses.length ? nextCourses : [createEmptyCourse()],
      };
    });
  };

  /* ======================
     REGISTER TEACHER
  ====================== */
  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setRegisterError("Name, Email, and Password are required");
      return;
    }

    const courseError = validateCourseEntries(form.courses);
    if (courseError) {
      setRegisterError(courseError);
      return;
    }

    setRegisterLoading(true);
    setRegisterError("");

    try {
      const sanitizedCourses = sanitizeCourses(form.courses);
      const payload = {
        role: "teacher",
        name: form.name,
        email: form.email,
        password: form.password,
        ...(form.id && { id: form.id }),
        ...(form.phone && { phone: form.phone }),
        courses: sanitizedCourses,
      };

      const { data } = await axios.post("/api/signup", payload);
      const savedTeacher = normalizeTeacher({
        ...data,
        email: data?.email ?? payload.email,
        phone: data?.phone ?? payload.phone,
        id: data?.id ?? data?.teacher_id ?? data?.teacherId ?? payload.id,
        courses: Array.isArray(data?.courses) && data.courses.length ? data.courses : payload.courses,
      });

      alert(data?.message || `Teacher "${data?.name ?? payload.name}" registered successfully!`);
      setTeachers(prev => {
        const nextTeachers = savedTeacher ? [...prev, savedTeacher] : prev;
        localStorage.setItem("teachers", JSON.stringify(nextTeachers));
        return nextTeachers;
      });
      setForm({ id: "", name: "", email: "", password: "", phone: "", courses: [createEmptyCourse()] });
    } catch (err) {
      console.error("Teacher registration error:", err.response?.data || err.message);
      const errData = err.response?.data;
      const msg = errData?.message || errData?.detail || errData?.email?.[0] || errData?.name?.[0] || JSON.stringify(errData) || "Registration failed. Please try again.";
      setRegisterError(msg);
    } finally {
      setRegisterLoading(false);
    }
  };

  /* ======================
     SEARCH
  ====================== */
  const handleSearch = async () => {
    if (!filterYear && !filterProgram) {
      setFilterError("Please select at least Year or Program");
      return;
    }

    setFilterLoading(true);
    setFilterError("");
    setFilteredTeachers([]);

    try {
      const params = new URLSearchParams();
      if (filterYear) params.append("years", filterYear);
      if (filterProgram) params.append("programs", filterProgram);

      const { data } = await axios.get(`/api/teachers/?${params.toString()}`);
      console.log("Teachers API raw response:", JSON.stringify(data, null, 2));

      const list = Array.isArray(data) ? data : (data.results ?? []);
      console.log("First teacher object:", list[0]);
      setFilteredTeachers(list);
      if (list.length === 0) setFilterError("No teachers found for selected filters.");
    } catch (err) {
      setFilterError(err.response?.data?.message || "Failed to fetch teachers.");
    } finally {
      setFilterLoading(false);
    }
  };

  /* ======================
     DELETE
  ====================== */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this teacher?")) return;

    try {
      await axios.delete(`/api/teachers/${id}/`);
      setFilteredTeachers(prev => prev.filter(t => (t.teacher_id || t.id || t.teacherId) !== id));
      setTeachers(prev => prev.filter(t => (t.teacher_id || t.id || t.teacherId) !== id));
      alert("Teacher deleted successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete teacher.");
    }
  };

  /* ======================
     UPDATE COURSES
  ====================== */
  const handleUpdateSubmit = async () => {
    const courseError = validateSyncCourseEntries(updateForm.courses);
    if (courseError) {
      setUpdateError(courseError);
      return;
    }

    setUpdateLoading(true);
    setUpdateError("");

    const syncCourses = buildSyncCoursesPayload(updateForm.courses);

    try {
      const { data } = await axios.patch(`/api/teachers/${updateForm.id}/sync-courses/`, {
        courses: syncCourses,
      });

      const responseCourses = [
        ...(Array.isArray(data?.kept) ? data.kept : []),
        ...(Array.isArray(data?.added) ? data.added : []),
      ];
      const normalizedResponseCourses = responseCourses.length
        ? responseCourses.map(normalizeCourse)
        : syncCourses.map(normalizeCourse);
      const derivedMeta = deriveTeacherMeta(normalizedResponseCourses);

      const applyTeacherUpdate = (teacher) => {
        const teacherId = teacher.teacher_id || teacher.id || teacher.teacherId;
        if (String(teacherId) !== String(updateForm.id)) return teacher;

        return {
          ...teacher,
          courses: normalizedResponseCourses,
          years: derivedMeta.years.length ? derivedMeta.years : teacher.years,
          programs: derivedMeta.departments.length ? derivedMeta.departments : teacher.programs,
          department: derivedMeta.departments.length
            ? derivedMeta.department
            : (teacher.department || "N/A"),
          sections: derivedMeta.sections,
        };
      };

      const updatedTeachers = teachers.map(applyTeacherUpdate);
      const updatedFilteredTeachers = filteredTeachers.map(applyTeacherUpdate);

      localStorage.setItem("teachers", JSON.stringify(updatedTeachers));
      setTeachers(updatedTeachers);
      setFilteredTeachers(updatedFilteredTeachers);
      setShowUpdateModal(false);
      alert(data?.message || "Teacher courses synchronized successfully.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to synchronize teacher courses.";
      setUpdateError(msg);
    } finally {
      setUpdateLoading(false);
    }
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="content-box">

      <div className="section-title">
        <span className="section-title-left">
          <BookOpen size={20} />
          <span>Manage Teachers</span>
        </span>
        <span className="badge">{teachers.length} Total</span>
      </div>

      {/* REGISTER */}
      <div className="card-inner">
        <h4>Register New Teacher</h4>

        <div className="grid-2">
          <input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} />
          <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange} />
          <input name="id" placeholder="Teacher ID" value={form.id} onChange={handleChange} />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        </div>

        <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <h5 style={{ margin: 0 }}>Allotted Courses</h5>
            <button
              type="button"
              className="primary-outline"
              onClick={() => addCourseField(setForm, "courses")}
            >
              Add Course
            </button>
          </div>

          {form.courses.map((course, index) => (
            <div
              key={`register-course-${index}`}
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
                <button
                  type="button"
                  className="del-btn"
                  onClick={() => removeCourseField(setForm, "courses", index)}
                >
                  Remove
                </button>
              </div>

              <div className="grid-2">
                <input
                  placeholder="Course Name"
                  value={course.courseName}
                  onChange={e => updateCourseList(setForm, "courses", index, "courseName", e.target.value)}
                />
                <input
                  placeholder="Course Code"
                  value={course.courseCode}
                  onChange={e => updateCourseList(setForm, "courses", index, "courseCode", e.target.value)}
                />
                <input
                  placeholder="Year"
                  value={course.year}
                  onChange={e => updateCourseList(setForm, "courses", index, "year", e.target.value)}
                />
                <input
                  placeholder="Dept"
                  value={course.dept}
                  onChange={e => updateCourseList(setForm, "courses", index, "dept", e.target.value)}
                />
                <input
                  placeholder="Section"
                  value={course.section}
                  onChange={e => updateCourseList(setForm, "courses", index, "section", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {registerError && <p style={{ color: "red", marginBottom: "8px" }}>{registerError}</p>}
        <button className="primary" onClick={handleRegister} disabled={registerLoading}>
          {registerLoading ? "Registering..." : "Register Teacher"}
        </button>
      </div>

      {/* SEARCH */}
      <div className="card-inner small">
        <h4 className="heading-bold">Search Teachers</h4>

        <div className="filters-inline">
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">Select Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Program options from API filter options (fallback to admin programs) */}
          <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
            <option value="">Select Program</option>
            {filterProgramOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <button className="primary-outline" onClick={handleSearch} disabled={filterLoading}>
            {filterLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {filterError && <p style={{ color: "red", margin: "8px 0" }}>{filterError}</p>}

        {/* RESULTS */}
        <div className="placeholder">
          {filteredTeachers.length === 0 ? (
            !filterError && <p>Use the filters above to search teachers.</p>
          ) : (
            <table className="simple-table teacher-search-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll No</th>
                  <th>Years</th>
                  <th>Programs</th>
                  <th>Sections</th>
                  <th>Courses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t, idx) => {
                  const normalizedTeacher = normalizeTeacher(t) ?? {};
                  const tid = t.teacher_id || normalizedTeacher.id || t.teacherId || idx;
                  const tname = normalizedTeacher.name || t.full_name || t.teacher_name || "-";
                  const tIdDisplay = t.teacher_rollNo || t.teacherRollNo || normalizedTeacher.rollNo || t.teacher_id || normalizedTeacher.id || t.teacherId || "-";
                  const tYears = Array.isArray(normalizedTeacher.years) && normalizedTeacher.years.length
                    ? normalizedTeacher.years.join(", ")
                    : (Array.isArray(t.batches) ? t.batches.join(", ") : (t.years || t.year || "-"));
                  const tPrograms = Array.isArray(normalizedTeacher.programs) && normalizedTeacher.programs.length
                    ? normalizedTeacher.programs.join(", ")
                    : (t.programs || t.program || normalizedTeacher.department || t.dept || t.department || "-");
                  const tSections = Array.isArray(normalizedTeacher.sections) && normalizedTeacher.sections.length
                    ? normalizedTeacher.sections.join(", ")
                    : "-";
                  const defaultDept = Array.isArray(normalizedTeacher.programs) && normalizedTeacher.programs.length
                    ? normalizedTeacher.programs[0]
                    : (t.program || t.programs || normalizedTeacher.department || t.dept || t.department || "");
                  const tCoursesForEdit = Array.isArray(normalizedTeacher.courses) && normalizedTeacher.courses.length
                    ? normalizedTeacher.courses.map(course => ({
                        ...course,
                        dept: course?.dept || defaultDept,
                      }))
                    : [createEmptyCourse()];
                  return (
                  <tr key={tid}>
                    <td>{tname}</td>
                    <td>{tIdDisplay}</td>
                    <td>{tYears}</td>
                    <td>{tPrograms}</td>
                    <td>{tSections}</td>
                    <td>{formatCourseSummary(normalizedTeacher.courses)}</td>
                    <td>
                      <div className="modify">
                        <button
                          className="update-btn"
                          onClick={() => {
                            setUpdateForm({
                              id: tid,
                              courses: tCoursesForEdit.map(course => ({ ...course })),
                            });
                            setUpdateError("");
                            setShowUpdateModal(true);
                          }}
                        >
                          Update
                        </button>
                        <button
                          className="del-btn"
                          onClick={() => handleDelete(tid)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <h3>Update Teacher Courses</h3>
            <div style={{ display: "grid", gap: "12px", overflowY: "auto", maxHeight: "calc(90vh - 170px)", paddingRight: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <span>Edit allotted courses</span>
                <button
                  type="button"
                  className="primary-outline"
                  onClick={() => addCourseField(setUpdateForm, "courses")}
                >
                  Add Course
                </button>
              </div>

              {updateForm.courses.map((course, index) => (
                <div
                  key={`update-course-${index}`}
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
                    <button
                      type="button"
                      className="del-btn"
                      onClick={() => removeCourseField(setUpdateForm, "courses", index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid-2">
                    <input
                      placeholder="Course Name"
                      value={course.courseName}
                      onChange={e => updateCourseList(setUpdateForm, "courses", index, "courseName", e.target.value)}
                    />
                    <input
                      placeholder="Course Code"
                      value={course.courseCode}
                      onChange={e => updateCourseList(setUpdateForm, "courses", index, "courseCode", e.target.value)}
                    />
                    <input
                      placeholder="Year"
                      value={course.year}
                      onChange={e => updateCourseList(setUpdateForm, "courses", index, "year", e.target.value)}
                    />
                    <input
                      placeholder="Dept"
                      value={course.dept}
                      onChange={e => updateCourseList(setUpdateForm, "courses", index, "dept", e.target.value)}
                    />
                    <input
                      placeholder="Section"
                      value={course.section}
                      onChange={e => updateCourseList(setUpdateForm, "courses", index, "section", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {updateError && <p style={{ color: "red", margin: 0 }}>{updateError}</p>}
            </div>
            <div className="modal-actions" style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #eee" }}>
              <button onClick={() => setShowUpdateModal(false)}>Cancel</button>
              <button onClick={handleUpdateSubmit} disabled={updateLoading}>
                {updateLoading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageTeachers;
