import React from "react";


const ProfileCard = ({ profile }) => {
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
   <div className="profile-card">
  <div className="profile-avatar">👤</div>
  <h3>{profile?.name || "Student"}</h3>

  <p><strong>Student ID:</strong> {profile.studentId}</p>
   <p><strong>Email:</strong> {user.email}</p>
  <p><strong>Role:</strong> {user.role}</p>
  <p><strong>Year:</strong> {profile.year}</p>
  <p><strong>Section:</strong> {profile.section}</p>
  <p><strong>Department:</strong> {profile.department}</p>
</div>

     );
};

export default ProfileCard;