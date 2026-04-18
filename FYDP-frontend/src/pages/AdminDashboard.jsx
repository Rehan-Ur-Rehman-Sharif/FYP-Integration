import React, { useState } from "react";
import orgAdminData from "../data/OrgAdminData";
import "../styles/orgAdmin.css";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  DollarSign,
  Users,
  User
} from "lucide-react";

import Overview from "../components/Admin/Overview";
import Admins from "../components/Admin/Admins";
import EventAdmins from "../components/Admin/EventAdmins";
import Meetings from "../components/Admin/Meetings";
import Payments from "../components/Admin/Payments";
import Userss from "../components/Admin/Userss";


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const renderComponent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "admins":
        return <Admins data={orgAdminData.admins} />;
      case "eventAdmins":
        return <EventAdmins />;
      case "meetings":
        return <Meetings />;
      case "payments":
        return <Payments />;
      case "users":
        return <Userss />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="orgdash">
        <div className="mainn">
      <h2>Admin Dashboard</h2>
      <p>SaaS Platform - Multi-Organization Management</p>
     </div>
     <br></br>
     <div className="mainbox">
      <div className="tabs-container">
  <button
    className={activeTab === "overview" ? "tab active" : "tab"}
    onClick={() => setActiveTab("overview")}
  >
    <span className="tab-icon"> <LayoutDashboard size={18} /></span>
    Overview
  </button>

  <button
    className={activeTab === "admins" ? "tab active" : "tab"}
    onClick={() => setActiveTab("admins")}
  >
    <span className="tab-icon"> <Users size={18} /></span>
    Admins
  </button>

  <button
    className={activeTab === "eventAdmins" ? "tab active" : "tab"}
    onClick={() => setActiveTab("eventAdmins")}
  >
    <span className="tab-icon"> <CalendarDays size={18} /></span>
    Event Admins
  </button>

  <button
    className={activeTab === "meetings" ? "tab active" : "tab"}
    onClick={() => setActiveTab("meetings")}
  >
    <span className="tab-icon"><CalendarCheck size={18} /></span>
    Meetings
  </button>

  <button
    className={activeTab === "payments" ? "tab active" : "tab"}
    onClick={() => setActiveTab("payments")}
  >
    <span className="tab-icon"><DollarSign size={18} /></span>
    Payments
  </button>

  <button
    className={activeTab === "users" ? "tab active" : "tab"}
    onClick={() => setActiveTab("users")}
  >
    <span className="tab-icon"> <User size={18} /></span>
    Users
  </button>
  
</div>
<div className="content">{renderComponent()}</div>

      </div>

      
    </div>
  );
};

export default AdminDashboard;
