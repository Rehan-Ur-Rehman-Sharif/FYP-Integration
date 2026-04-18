// src/components/admin/AdminHeader.jsx
import React from "react";
import {
  User
} from "lucide-react";

const AdminHeader = ({ tab, setTab }) => {
  return (
    <div className="admin-header">
      <div className="admin-left">
        <div className="admin-icon"> <User size={24} color="#ffffff"strokeWidth={2.5} />
</div>
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted">Welcome, Administrator</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={tab==="requests" ? "tab active" : "tab"} onClick={() => setTab("requests")}>Attendance Requests</button>
        <button className={tab==="students" ? "tab active" : "tab"} onClick={() => setTab("students")}>Manage Students</button>
        <button className={tab==="teachers" ? "tab active" : "tab"} onClick={() => setTab("teachers")}>Manage Teachers</button>
        <button className={tab==="view" ? "tab active" : "tab"} onClick={() => setTab("view")}>View Attendance</button>
      </div>
    </div>
  );
};

export default AdminHeader;
