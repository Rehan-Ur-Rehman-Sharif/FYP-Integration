import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/admin/AdminHeader";
import AttendanceRequests from "../components/admin/AttendenceRequest";
import ManageStudents from "../components/admin/ManageStudents";
import ManageTeachers from "../components/admin/ManageTeacher";
import ViewAttendance from "../components/admin/ViewAttendence";
import "../styles/admin.css";
import {
  listStudents,
  listTeachers,
  listCourses,
  listAttendanceRequests,
} from "../api/admin";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);

  // Authentication check
  useEffect(() => {
    const currentUserStr = localStorage.getItem("currentUser");
    if (!currentUserStr) { navigate("/login"); return; }
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser.role !== "admin") { navigate("/login"); return; }
      setAdminProfile(currentUser);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // Load data from API whenever tab changes
  useEffect(() => {
    if (!adminProfile) return;
    if (tab === "requests") {
      listAttendanceRequests({ status: "pending" })
        .then(setRequests)
        .catch(() => setRequests([]));
    } else if (tab === "students") {
      listStudents().then(setStudents).catch(() => setStudents([]));
    } else if (tab === "teachers") {
      listTeachers().then(setTeachers).catch(() => setTeachers([]));
    } else if (tab === "view") {
      listStudents().then(setStudents).catch(() => setStudents([]));
      listCourses().then(setCourses).catch(() => setCourses([]));
    }
  }, [tab, adminProfile]);

  if (!adminProfile) return null;

  return (
    <div className="admin-page">
      <AdminHeader tab={tab} setTab={setTab} />

      {tab === "requests" && (
        <AttendanceRequests requests={requests} onRefresh={() =>
          listAttendanceRequests({ status: "pending" }).then(setRequests).catch(() => {})} />
      )}

      {tab === "students" && (
        <ManageStudents
          students={students}
          years={["1", "2", "3", "4"]}
          programs={["BSCS", "BSIT", "BSSE", "AI"]}
          onRegister={() => listStudents().then(setStudents).catch(() => {})}
        />
      )}

      {tab === "teachers" && (
        <ManageTeachers
          teachers={teachers}
          years={["1", "2", "3", "4"]}
          programs={["BSCS", "BSIT", "BSSE"]}
          departments={["Computer Science", "IT"]}
          onRegister={() => listTeachers().then(setTeachers).catch(() => {})}
        />
      )}

      {tab === "view" && (
        <ViewAttendance
          years={["1", "2", "3", "4"]}
          batches={["2021", "2022", "2023", "2024"]}
          programs={["BSCS", "BSIT", "BSSE"]}
          courses={courses}
          records={{}}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

