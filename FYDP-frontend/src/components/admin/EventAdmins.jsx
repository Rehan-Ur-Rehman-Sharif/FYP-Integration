import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosInstance";

const EventAdmins = () => {
  const [eventAdmins, setEventAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
  });

   const [editData, setEditData] = useState({
      status: "active",
    });
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const fetchEventAdmins = async () => {
    try {
      const { data } = await axios.get("/api/events/event-admins/");
      setEventAdmins(normalizeList(data));
    } catch (error) {
      console.error("Failed to fetch event admins:", error);
      setEventAdmins([]);
    }
  };

  useEffect(() => {
    fetchEventAdmins();
  }, []);

  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.email) return;

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        organization: formData.organization,
        status: "active",
      };

      const { data } = await axios.post("/api/events/event-admins/", payload);
      setEventAdmins((prev) => [data, ...prev]);
      setShowModal(false);

      setFormData({
        name: "",
        email: "",
        organization: "",
      });
    } catch (error) {
      console.error("Failed to create event admin:", error);
      alert("Could not create event admin. Please try again.");
    }
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/events/event-admins/${id}/`);
      setEventAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete event admin:", error);
      alert("Could not delete event admin. Please try again.");
    }
  };

  // ✅ UPDATE
  const handleUpdate = async () => {
    if (!selectedAdmin) return;

    try {
      const { data } = await axios.patch(`/api/events/event-admins/${selectedAdmin.id}/`, {
        status: editData.status,
      });

      setEventAdmins((prev) =>
        prev.map((a) => (a.id === selectedAdmin.id ? data : a))
      );
      setSelectedAdmin(data);
      setEditModal(false);
    } catch (error) {
      console.error("Failed to update event admin:", error);
      alert("Could not update event admin. Please try again.");
    }
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Event Admin Management</h3>
        <button
          className="primary-btn"
          onClick={() => setShowModal(true)}
        >
          + Add Event Admin
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Organization Name</th>
            <th>Email</th>
            <th>Organization</th>
            <th>Events Managed</th>
            <th>Active Events</th>
            <th>Status</th>
            <th>Join Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {eventAdmins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.name}</td>
              <td>{admin.email}</td>
              <td>{admin.organization}</td>
              <td>{admin.eventsManaged}</td>
              <td>
                <span className="active">{admin.activeEvents}</span>
              </td>
              <td>
                <span
                  className={
                    admin.status === "active"
                      ? "status active"
                      : "status inactive"
                  }
                >
                  {admin.status}
                </span>
              </td>
              <td>{admin.joinDate}</td>
             <td className="actions">
  <button
    className="btn-view"
    onClick={() => {
      setSelectedAdmin(admin);
      setViewModal(true);
    }}
  >
    View
  </button>

  <button
    className="btn-edit"
    onClick={() => {
      setSelectedAdmin(admin);
      setEditData({ status: admin.status });
      setEditModal(true);
    }}
  >
    Edit
  </button>

  <button
    className="btn-delete"
    onClick={() => handleDelete(admin.id)}
  >
    Delete
  </button>
</td>
            </tr>
          ))}
        </tbody>
      </table>
       {viewModal && selectedAdmin && (
  <div className="modal-overlay">
    <div className="modal">

      {/* Header */}
      <div className="modal-header">
       <h1>Event Admin Details</h1>
        <button onClick={() => setViewModal(false)}>✕</button>
      </div>

      {/* Grid Layout */}
      <div className="form-grid">

        <input value={selectedAdmin.name} disabled />
        <input value={selectedAdmin.email} disabled />
          <input value={selectedAdmin.organization} disabled />
          <input value={selectedAdmin.eventsManaged} disabled />
          <input value={selectedAdmin.activeEvents} disabled />
        <input value={selectedAdmin.status} disabled />

      </div>

      {/* Footer */}
      <div className="modal-actions">
        <button className="btn-cancel" onClick={() => setViewModal(false)}>
          Close
        </button>
      </div>

    </div>
  </div>
)}

      {/* ✅ EDIT MODAL */}
     {editModal && selectedAdmin && (
  <div className="modal-overlay">
    <div className="modal">

      {/* Header */}
      <div className="modal-header">
        <h2>Edit Admin</h2>
        <button onClick={() => setEditModal(false)}>✕</button>
      </div>

      {/* Grid */}
      <div className="form-grid">

        <input value={selectedAdmin.name} disabled />
        <input value={selectedAdmin.email} disabled />

      

        <select
          value={editData.status}
          onChange={(e) =>
            setEditData({ ...editData, status: e.target.value })
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

      </div>

      {/* Actions */}
      <div className="modal-actions">
        <button className="btn-cancel" onClick={() => setEditModal(false)}>
          Cancel
        </button>
        <button className="btn-create" onClick={handleUpdate}>
          Update
        </button>
      </div>

    </div>
  </div>
)}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Event Admin</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
              />
              <input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                name="organization"
                placeholder="Organization"
                value={formData.organization}
                onChange={handleChange}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-create"
                onClick={handleCreateAdmin}
              >
                Create Event Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAdmins;