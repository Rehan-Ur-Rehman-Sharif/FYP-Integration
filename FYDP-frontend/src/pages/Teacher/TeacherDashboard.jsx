import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./teacher.css";
import QRGenerator from "../../components/GenerateQRCode";
import { FaChalkboardTeacher } from "react-icons/fa";
import bgImage from '../../assets/background.jpeg';
import axiosInstance from "../../utils/axiosInstance";

const defaultAttendanceTypes = ["Lecture", "Lab"];

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => reject(err)
    );
  });

const mapAttendanceTypeForApi = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "lecture") return "regular";
  return normalized;
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [authTeacherId, setAuthTeacherId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [state, setState] = useState("form");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSlots, setSelectedSlots] = useState("");
  const [selectedSection, setSelectedSection] = useState("A");
  const [geoLocation, setGeoLocation] = useState({ lat: null, lng: null });
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [qrApiError, setQrApiError] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isStoppingQr, setIsStoppingQr] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isSubmittingUpdateRequest, setIsSubmittingUpdateRequest] = useState(false);
  const [updateRequestError, setUpdateRequestError] = useState("");
  const [requestForm, setRequestForm] = useState({
    studentRollNo: "",
    program: "",
    section: "A",
    courseCode: "",
    useCourseName: false,
    type: "",
    slotCount: "",
    reason: "",
  });

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      const stored = localStorage.getItem("currentUser");

      if (!stored) {
        navigate("/login");
        return;
      }

      let currentUser;
      try {
        currentUser = JSON.parse(stored);
      } catch {
        localStorage.removeItem("currentUser");
        navigate("/login");
        return;
      }

      const teacherId = currentUser.teacher_id ?? currentUser.teacherId ?? currentUser.id;
      if (currentUser.role !== "teacher" || !teacherId || !currentUser.token) {
        localStorage.removeItem("currentUser");
        navigate("/login");
        return;
      }

      setAuthTeacherId(Number(teacherId));

      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/api/teachers/${teacherId}/`);

        const mappedCourses = Array.isArray(data.courses)
          ? data.courses.map((course) => ({
              courseId: course.course ?? course.id ?? null,
              code: course.course_code ?? String(course.id ?? course.course ?? ""),
              name: course.course_name ?? "Unnamed Course",
            }))
          : [];

        setProfile({
          name: data.teacher_name ?? currentUser.teacher_name ?? "N/A",
          teacherId: data.teacher_rollNo ?? String(data.teacher_id ?? teacherId),
          department: data.management ? String(data.management) : "N/A",
          avatar: "👩‍🏫",
          coursesTeaching: mappedCourses.map((course) => course.code),
          batches: parseList(data.years),
          programs: parseList(data.programs),
          attendanceTypes: defaultAttendanceTypes,
          courses: mappedCourses,
        });
        setError("");
      } catch {
        setError("Failed to load teacher profile. Please login again.");
        localStorage.removeItem("currentUser");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherProfile();
  }, [navigate]);

  // Get geolocation when QR is active
  useEffect(() => {
    if (state === "active" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, [state]);

  // Reset all selections and QR state
  const resetForm = () => {
    setState("form");
    setSelectedBatch("");
    setSelectedProgram("");
    setSelectedType("");
    setSelectedCourse("");
    setSelectedSlots("");
    setSelectedSection("A");
    setGeoLocation({ lat: null, lng: null });
    setQrCodeImage("");
    setQrToken("");
    setActiveSession(null);
    setQrApiError("");
  };

  const startAttendanceQrSession = async () => {
    if (!authTeacherId) {
      setQrApiError("Teacher profile is still loading. Please try again.");
      return;
    }

    if (!selectedCourse || !selectedBatch || !selectedProgram || !selectedType || !selectedSlots) {
      setQrApiError("Please fill all attendance fields before generating QR.");
      return;
    }

    try {
      setIsGeneratingQr(true);
      setQrApiError("");

      const selectedCourseObj = courses.find((course) => course.code === selectedCourse);
      if (!selectedCourseObj || selectedCourseObj.courseId == null) {
        setQrApiError("Selected course is invalid or missing id.");
        return;
      }

      let location = geoLocation;
      if (location.lat == null || location.lng == null) {
        location = await getCurrentLocation();
        setGeoLocation(location);
      }

      const payload = {
        teacher: authTeacherId,
        // Use only one course field in payload: numeric course id.
        course: Number(selectedCourseObj.courseId),
        attendance_type: mapAttendanceTypeForApi(selectedType),
        program: selectedProgram,
        section: selectedSection,
        year: Number(selectedBatch),
        slot_count: Number(selectedSlots),
        latitude: location.lat,
        longitude: location.lng,
        radius_meters: 50,
      };

      const { data } = await axiosInstance.post("/api/attendance-sessions/generate-qr/", payload);

      setQrCodeImage(data.qr_code || "");
      setQrToken(data.qr_token || "");
      setActiveSession(data.session || null);
      setState("active");
    } catch (err) {
      const result = err.response?.data;
      const messages = result ? Object.values(result).flat().join(" ") : "Failed to generate QR session.";
      setQrApiError(messages || "Failed to generate QR session.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const stopAttendanceQrSession = async () => {
    const sessionId = activeSession?.id;
    if (!sessionId) {
      resetForm();
      return;
    }

    try {
      setIsStoppingQr(true);
      setQrApiError("");
      await axiosInstance.post(`/api/attendance-sessions/${sessionId}/stop/`);
      resetForm();
    } catch (err) {
      const result = err.response?.data;
      const messages = result ? Object.values(result).flat().join(" ") : "Failed to stop QR session.";
      setQrApiError(messages || "Failed to stop QR session.");
    } finally {
      setIsStoppingQr(false);
    }
  };

  const submitAttendanceRequest = async () => {
    if (!profile) return;

    setUpdateRequestError("");

    const studentRollNo = String(requestForm.studentRollNo || "").trim();
    const program = String(requestForm.program || "").trim();
    const section = String(requestForm.section || "").trim();
    const courseCode = String(requestForm.courseCode || "").trim();
    const reason = String(requestForm.reason || "").trim();
    const attendanceType = mapAttendanceTypeForApi(requestForm.type);
    const slotCount = Number(requestForm.slotCount);

    if (!studentRollNo) {
      setUpdateRequestError("Student roll number is required.");
      return;
    }

    if (!program) {
      setUpdateRequestError("Please select a program.");
      return;
    }

    if (!section) {
      setUpdateRequestError("Section is required.");
      return;
    }

    if (!courseCode) {
      setUpdateRequestError("Please select a course.");
      return;
    }

    if (!attendanceType) {
      setUpdateRequestError("Please select an attendance type.");
      return;
    }

    if (!Number.isFinite(slotCount) || slotCount <= 0) {
      setUpdateRequestError("Slot count must be a positive number.");
      return;
    }

    if (!reason) {
      setUpdateRequestError("Reason is required.");
      return;
    }

    const selectedCourse = courses.find((c) => String(c.code) === courseCode);

    const payload = {
      student_rollNo: studentRollNo,
      program,
      section,
      attendanceType,
      slot_count: slotCount,
      reason,
      ...(requestForm.useCourseName
        ? { course_name: selectedCourse?.name ?? "" }
        : { course_code: courseCode }),
    };

    if (requestForm.useCourseName && !payload.course_name) {
      setUpdateRequestError("Selected course is missing a course name.");
      return;
    }

    try {
      setIsSubmittingUpdateRequest(true);
      await axiosInstance.post("/api/update-attendance-requests/", payload);

      alert("Attendance update request sent ✅");
      setShowUpdateModal(false);
      setRequestForm({
        studentRollNo: "",
        program: "",
        section: "A",
        courseCode: "",
        useCourseName: false,
        type: "",
        slotCount: "",
        reason: "",
      });
    } catch (err) {
      const result = err.response?.data;
      const messages = result ? Object.values(result).flat().join(" ") : "Failed to send update request.";
      setUpdateRequestError(messages || "Failed to send update request.");
    } finally {
      setIsSubmittingUpdateRequest(false);
    }
  };

  const batches = profile?.batches ?? [];
  const programs = profile?.programs ?? [];
  const attendanceTypes = profile?.attendanceTypes ?? defaultAttendanceTypes;
  const courses = profile?.courses ?? [];

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!profile) {
    return <h2>{error || "Teacher not found"}</h2>;
  }







  return (
    <div
      className="teacher-page"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

    <div className="teacher-wrapper">

  <div className="teacher-card">

    {/* Top Blue Header */}
    <div className="card-header"></div>

    {/* Avatar Circle */}
    <div className="profile-avatar">
      <FaChalkboardTeacher color="#2C5F9E" size={50} />
    </div>

    {/* Teacher Details */}
    <h3 className="teacher-name">{profile.name}</h3>

    <ul className="teacher-details">
      <li><strong>Teacher ID:</strong> {profile.teacherId}</li>
      <li><strong>Department:</strong> {profile.department}</li>
      <li>
        <strong>Courses Teaching:</strong> {profile.coursesTeaching.join(", ")}
      </li>
    </ul>

  </div>




      {/* RIGHT SECTION */}
      <div className="right-section">
        <div className="top-actions">
          <button
            className="update-btn"
            onClick={() => {
              setUpdateRequestError("");
              setShowUpdateModal(true);
            }}
          >
            🔄 Update Attendance Request
          </button>
        </div>

        <div className="welcome-banner">
          Welcome back, {profile.name}!
        </div>

        {qrApiError && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {qrApiError}
          </p>
        )}

       {/* UPDATE MODAL */}
{showUpdateModal && (
  <div className="modal-overlay">
    <div className="modal-box">

      <div className="modal-header">
        <h3>Update Attendance Request</h3>
        <span
          className="close-btn"
          onClick={() => {
            setUpdateRequestError("");
            setShowUpdateModal(false);
          }}
        >
          ✖
        </span>
      </div>

      <div className="modal-content">

        {updateRequestError && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {updateRequestError}
          </p>
        )}

        {/* Student Roll No */}
        <label>Student Roll No</label>
        <input
          type="text"
          placeholder="e.g. RFID002"
          value={requestForm.studentRollNo}
          onChange={(e) =>
            setRequestForm({ ...requestForm, studentRollNo: e.target.value })
          }
        />

        {/* Program */}
        <label>Program</label>
        <select
          value={requestForm.program}
          onChange={(e) =>
            setRequestForm({ ...requestForm, program: e.target.value })
          }
        >
          <option value="">Select program</option>
          {programs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Section */}
        <label>Section</label>
        <input
          type="text"
          placeholder="e.g. A"
          value={requestForm.section}
          onChange={(e) =>
            setRequestForm({ ...requestForm, section: e.target.value })
          }
        />

        {/* Course (by code or name) */}
        <label>Course</label>
        <select
          value={requestForm.courseCode}
          onChange={(e) =>
            setRequestForm({ ...requestForm, courseCode: e.target.value })
          }
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option
              key={c.code ?? c.name}
              value={c.code ?? ""}
              disabled={!c.code}
            >
              {c.code} – {c.name}
            </option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <input
            type="checkbox"
            checked={requestForm.useCourseName}
            onChange={(e) =>
              setRequestForm({ ...requestForm, useCourseName: e.target.checked })
            }
          />
          Send using course name (instead of code)
        </label>

        {/* Attendance Type */}
        <label>Attendance Type</label>
        <select
          value={requestForm.type}
          onChange={(e) =>
            setRequestForm({ ...requestForm, type: e.target.value })
          }
        >
          <option value="">Select type</option>
          {attendanceTypes.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Slot Count */}
        <label>Slot Count</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 2"
          value={requestForm.slotCount}
          onChange={(e) =>
            setRequestForm({ ...requestForm, slotCount: e.target.value })
          }
        />

        {/* Reason */}
        <label>Reason</label>
        <input
          type="text"
          placeholder="Reason for update"
          value={requestForm.reason}
          onChange={(e) =>
            setRequestForm({ ...requestForm, reason: e.target.value })
          }
        />

      </div>

      <div className="modal-actions">
        <button
          className="cancel-btn"
          disabled={isSubmittingUpdateRequest}
          onClick={() => {
            setUpdateRequestError("");
            setShowUpdateModal(false);
          }}
        >
          Cancel
        </button>

        <button
          className="submit-btn"
          onClick={submitAttendanceRequest}
          disabled={isSubmittingUpdateRequest}
        >
          {isSubmittingUpdateRequest ? "Submitting..." : "Submit"}
        </button>
      </div>

    </div>
  </div>
)}


        {/* FORM STATE */}
        {state === "form" && (
          <div className="card">
            <div className="card-title">Live Attendance Form</div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-field">
                  <label>Batch</label>
                  <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                    <option value="">Select batch</option>
                    {batches.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label>Program</label>
                  <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
                    <option value="">Select program</option>
                    {programs.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label>Attendance Type</label>
                  <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                    <option value="">Select type</option>
                    {attendanceTypes.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>

                <div className="form-field form-field-full">
                  <label>Course Name</label>
                  <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                    <option value="">Select course</option>
                    {courses.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} – {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Number of Slots</label>
                  <input
                    type="number"
                    placeholder="Enter number of slots"
                    value={selectedSlots}
                    onChange={e => setSelectedSlots(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="start-btn"
                onClick={startAttendanceQrSession}
                disabled={isGeneratingQr}
              >
                {isGeneratingQr ? "Generating..." : "▶ Generate QR"}
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE QR STATE */}
        {state === "active" && (
          <div className="card active-card">
            <div className="card-title">Live Attendance QR</div>
            <div className="active-box">
              <p><strong>QR Active</strong></p>
              <p><strong>Course:</strong> {selectedCourse || "-"}</p>
              <p><strong>Batch:</strong> {selectedBatch}</p>
              <p><strong>Program:</strong> {selectedProgram}</p>
              <p><strong>Type:</strong> {selectedType}</p>
              <p><strong>Section:</strong> {selectedSection}</p>
              <p><strong>Slots:</strong> {selectedSlots}</p>
              <p><strong>Session ID:</strong> {activeSession?.id ?? "-"}</p>
              <p><strong>Geolocation:</strong> {geoLocation.lat != null && geoLocation.lng != null ? `${geoLocation.lat}, ${geoLocation.lng}` : "Fetching..."}</p>
            </div>

            <QRGenerator
              qrCode={qrCodeImage}
              qrToken={qrToken}
              session={activeSession}
              loading={isGeneratingQr}
              error={qrApiError}
            />

            <button className="stop-btn" onClick={stopAttendanceQrSession} disabled={isStoppingQr}>
              {isStoppingQr ? "Stopping..." : "■ Stop QR & Return"}
            </button>
          </div>
        )}

      </div>
    </div>
    </div>
  );
};

export default TeacherDashboard;
