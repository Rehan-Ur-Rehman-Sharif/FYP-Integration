import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosInstance";
import adminData from "../../data/AdminData";
import AdminHeader from "../../components/OrganizationalAdmin/AdminHeader";
import AttendanceRequests from "../../components/OrganizationalAdmin/AttendenceRequest";
import ManageStudents from "../../components/OrganizationalAdmin/ManageStudents";
import ManageTeachers from "../../components/OrganizationalAdmin/ManageTeacher";
import ViewAttendance from "../../components/OrganizationalAdmin/ViewAttendence";
import "../../styles/admin.css";
import "./OrganizationalAdmin.css";

const OrganizationalAdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [studentFilterOptions, setStudentFilterOptions] = useState({
    years: adminData.years ?? [],
    programs: adminData.programs ?? [],
  });
  const [teacherFilterOptions, setTeacherFilterOptions] = useState({
    years: adminData.years ?? [],
    programs: adminData.programs ?? [],
  });

  useEffect(() => {
    document.body.classList.add("orgadmin-page");
    return () => {
      document.body.classList.remove("orgadmin-page");
    };
  }, []);

  // ✅ AUTHENTICATION — validate against API session stored in localStorage
  const currentUserStr = localStorage.getItem("currentUser");
  let adminProfile = null;

  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser.role === "orgadmin" && currentUser.token) {
        adminProfile = {
          name: currentUser.management_name,
          email: currentUser.email,
          adminId: currentUser.management_id,
          department: currentUser.department ?? "",
        };
      }
    } catch {}
  }

  // ❌ Not admin → kick out
  useEffect(() => {
    if (!adminProfile) navigate("/login");
  }, [adminProfile, navigate]);

  // ✅ Fetch attendance requests from API
  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(`/api/update-attendance-requests/?management_id=${adminProfile?.adminId}`);
      setRequests(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      console.error("Failed to fetch attendance requests", err);
    }
  };

  const fetchStudentFilterOptions = async () => {
    try {
      const { data } = await axios.get("/api/students/filter-options/");

      const years = Array.isArray(data?.years)
        ? data.years.map((value) => String(value))
        : [];

      const programs = Array.isArray(data?.programs) && data.programs.length
        ? data.programs
        : Array.isArray(data?.departments)
          ? data.departments
          : [];

      setStudentFilterOptions({
        years: years.length ? years : (adminData.years ?? []),
        programs: programs.length ? programs : (adminData.programs ?? []),
      });
    } catch (err) {
      console.error("Failed to fetch student filter options", err);
    }
  };

  const fetchTeacherFilterOptions = async () => {
    try {
      const { data } = await axios.get("/api/teachers/filter-options/");

      const years = Array.isArray(data?.years)
        ? data.years.map((value) => String(value))
        : [];

      const programs = Array.isArray(data?.programs)
        ? data.programs
        : [];

      setTeacherFilterOptions({
        years: years.length ? years : (adminData.years ?? []),
        programs: programs.length ? programs : (adminData.programs ?? []),
      });
    } catch (err) {
      console.error("Failed to fetch teacher filter options", err);
    }
  };

  useEffect(() => {
    if (tab === "requests") fetchRequests();
  }, [tab]);

  useEffect(() => {
    if (!adminProfile?.adminId) return;
    fetchStudentFilterOptions();
    fetchTeacherFilterOptions();
  }, [adminProfile?.adminId]);

  /* ---------------- REGISTER STUDENT ---------------- */
  const handleRegisterStudent = (student) => {
    alert(`Student "${student.name}" registered successfully!`);
  };

  /* ---------------- REGISTER TEACHER ---------------- */
  const handleRegisterTeacher = (teacher) => {
    let storedTeachers = [];

    try {
      storedTeachers = JSON.parse(localStorage.getItem("teachers")) || [];
    } catch {
      storedTeachers = [];
    }

    if (!Array.isArray(storedTeachers)) storedTeachers = [];

    const exists = storedTeachers.find(t => t.id === teacher.id);
    if (exists) {
      alert("Teacher ID already exists");
      return;
    }

    const newTeacher = {
      ...teacher,
      password: teacher.id,
      dept: adminProfile.department // ✅ same department as admin
    };

    storedTeachers.push(newTeacher);
    localStorage.setItem("teachers", JSON.stringify(storedTeachers));

    alert(
      `Teacher registered!\n\nLogin:\nID: ${newTeacher.id}\nPassword: ${newTeacher.password}`
    );
  };

  return (
    <div className="admin-page">
      <AdminHeader tab={tab} setTab={setTab} />

      {tab === "requests" && (
        <AttendanceRequests requests={requests} onRefresh={fetchRequests} />
      )}

      {tab === "students" && (
        <ManageStudents
          students={adminData.students}
          years={studentFilterOptions.years}
          programs={studentFilterOptions.programs}
          onRegister={handleRegisterStudent}
        />
      )}

      {tab === "teachers" && (
        <ManageTeachers
          teachers={adminData.teachers}
          years={teacherFilterOptions.years}
          programs={teacherFilterOptions.programs}
          departments={adminData.departments}
          onRegister={handleRegisterTeacher}
        />
      )}

      {tab === "view" && (
        <ViewAttendance
          years={studentFilterOptions.years}
          batches={adminData.batches}
          programs={studentFilterOptions.programs}
          courses={adminData.courses}
          records={adminData.studentAttendanceRecords}
        />
      )}
    </div>
  );
};

export default OrganizationalAdminDashboard;
