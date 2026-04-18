import React from "react";
import orgAdminData from "../../data/OrgAdminData";
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Clock,
  User
} from "lucide-react";

const Overview = () => {
  const data = orgAdminData.overview;

  return (
    <div className="overview-grid">

      <div className="card">
        <div className="icon blue">
          <Users size={22} />
        </div>
        <div className="card-content">
          <span>Total Admins</span>
          <h2>{data.totalAdmins}</h2>
        </div>
      </div>

      <div className="card">
        <div className="icon purple">
          <UserCheck size={22} />
        </div>
        <div className="card-content">
          <span>Event Admins</span>
          <h2>{data.eventAdmins}</h2>
        </div>
      </div>

      <div className="card">
        <div className="icon green">
          <User size={22} />
        </div>
        <div className="card-content">
          <span>Participants</span>
          <h2>{data.participants}</h2>
        </div>
      </div>

      <div className="card">
        <div className="icon orange">
          <GraduationCap size={22} />
        </div>
        <div className="card-content">
          <span>Students</span>
          <h2>{data.students}</h2>
        </div>
      </div>

      <div className="card">
        <div className="icon cyan">
          <BookOpen size={22} />
        </div>
        <div className="card-content">
          <span>Teachers</span>
          <h2>{data.teachers}</h2>
        </div>
      </div>

      <div className="card">
        <div className="icon red">
          <Clock size={22} />
        </div>
        <div className="card-content">
          <span>Pending Meetings</span>
          <h2>{data.pendingMeetings}</h2>
        </div>
      </div>

    </div>
    
  );
};

export default Overview;