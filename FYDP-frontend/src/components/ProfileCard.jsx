import React from "react";
import { User } from "lucide-react";

const ProfileCard = ({ profile, onScanClick }) => {
  // 1️⃣ Read from localStorage

  const storedUser = localStorage.getItem("currentUser");
console.log("ProfileCard storedUser data:", storedUser);
  // 2️⃣ Parse safely
  const user = storedUser ? JSON.parse(storedUser) : null;
  // 3️⃣ Safety check (VERY IMPORTANT)
  if (!profile) {
    return <p>Loading profile...</p>;
  }
     return (
  <div className="profile-container">
      <div className="profile-header"></div>

      <div className="profile-avatar">
        <div className="avatar-icon"> <User size={50} color="#5A6F8E" strokeWidth={2.5} /></div>
      </div>

      <div className="profile-content">
        <h2 className="profile-name">
          <strong>{profile?.name || "John Smith"}</strong>
        </h2>

        <ul className="profile-list">
          <li>Student ID: {profile.studentId}</li>
          <li>Year: {profile.year}</li>
          <li>Section: {profile.section}</li>
          <li>Department: {profile.department}</li>
        </ul>

        {typeof onScanClick === "function" && (
          <button className="scan-btn" onClick={onScanClick}>
            Scan QR for Attendance
          </button>
        )}
      </div>
    </div>
  );
};
export default ProfileCard;