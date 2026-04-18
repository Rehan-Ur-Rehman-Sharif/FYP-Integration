import React, { useState } from "react";
import orgAdminData from "../../data/OrgAdminData";

const Users = () => {
  const [users, setUsers] = useState(orgAdminData.users);

  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [editData, setEditData] = useState({
    role: "",
    status: "",
  });

  // ✅ DELETE
  const handleDelete = (id) => {
    if (!window.confirm("Delete this user?")) return;

    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
  };

  // ✅ UPDATE
  const handleUpdate = () => {
    const updated = users.map((u) =>
      u.id === selectedUser.id
        ? {
            ...u,
            role: editData.role,
            status: editData.status,
          }
        : u
    );

    setUsers(updated);
    setEditModal(false);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Current Users</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Organization</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.organization}</td>
              <td>{user.department}</td>

              {/* STATUS */}
              <td>
                <span className={`status ${user.status}`}>
                  {user.status}
                </span>
              </td>

              {/* ACTIONS */}
              <td className="actions">
                <button
                  className="btn-view"
                  onClick={() => {
                    setSelectedUser(user);
                    setViewModal(true);
                  }}
                >
                  View
                </button>

                <button
                  className="btn-edit"
                  onClick={() => {
                    setSelectedUser(user);
                    setEditData({
                      role: user.role,
                      status: user.status,
                    });
                    setEditModal(true);
                  }}
                >
                  Update
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(user.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ VIEW MODAL */}
      {viewModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h2>User Details</h2>
              <button onClick={() => setViewModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <input value={selectedUser.name} disabled />
              <input value={selectedUser.email} disabled />
              <input value={selectedUser.role} disabled />
              <input value={selectedUser.organization} disabled />
              <input value={selectedUser.department} disabled />
              <input value={selectedUser.status} disabled />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setViewModal(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ✅ EDIT MODAL */}
      {editModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h2>Update User</h2>
              <button onClick={() => setEditModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <input value={selectedUser.name} disabled />
              <input value={selectedUser.email} disabled />

              {/* ROLE */}
              <select
                value={editData.role}
                onChange={(e) =>
                  setEditData({ ...editData, role: e.target.value })
                }
              >
                <option value="Admin">Admin</option>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Employee">Employee</option>
              </select>

              {/* STATUS */}
              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
              >
                <option value="online">online</option>
                <option value="offline">offline</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setEditModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn-create"
                onClick={handleUpdate}
              >
                Update
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Users;