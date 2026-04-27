import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosInstance";

const Admins = ({ data = [] }) => {
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    department: "",
    status: "active",
    rfid: "",
  });

  const [editData, setEditData] = useState({
    rfid: "",
    status: "active",
  });

  const filteredAdmins = admins.filter((admin) => {
    const orgName = (admin.name || "").toLowerCase();
    const email = (admin.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return orgName.includes(term) || email.includes(term);
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const fetchAdmins = async () => {
    try {
      const { data: response } = await axios.get("/api/organization-admins/");
      setAdmins(normalizeList(response));
    } catch (error) {
      console.error("Failed to fetch organization admins:", error);
      setAdmins([]);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // ✅ CREATE ADMIN
  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.email) return;

    try {
      const payload = {
        name: formData.name,
        organization: formData.organization,
        email: formData.email,
        status: formData.status,
      };
      const { data: created } = await axios.post("/api/organization-admins/", payload);
      setAdmins((prev) => [created, ...prev]);
      setShowModal(false);

      setFormData({
        name: "",
        email: "",
        organization: "",
        department: "",
        status: "active",
        rfid: "",
      });
    } catch (error) {
      console.error("Failed to create organization admin:", error);
      alert("Could not create admin. Please verify input and try again.");
    }
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/organization-admins/${id}/`);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete organization admin:", error);
      alert("Could not delete admin. Please try again.");
    }
  };

  // ✅ UPDATE
  const handleUpdate = async () => {
    if (!selectedAdmin) return;

    try {
      const payload = {
        status: editData.status,
        rfid: editData.rfid,
      };
      const { data: updated } = await axios.patch(
        `/api/organization-admins/${selectedAdmin.id}/`,
        payload
      );

      setAdmins((prev) =>
        prev.map((a) => (a.id === selectedAdmin.id ? updated : a))
      );
      setSelectedAdmin(updated);
      setEditModal(false);
    } catch (error) {
      console.error("Failed to update organization admin:", error);
      alert("Could not update admin. Ensure all RFID values are valid.");
    }
  };

  return (
    <div className="table-container">
      <div className="heading1">
        <h3>Admin Management (Multi-Organization)</h3>
        <button className="btn" onClick={() => setShowModal(true)}>
          + Add Admin
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search admins..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Organization Name</th>
            <th>Email</th>
            <th>Rfid</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredAdmins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.name}</td>
              <td>{admin.email}</td>

              {/* ✅ RFID DISPLAY */}
              <td>
                {admin.rfid?.slice(0, 3).map((id, i) => (
                  <span key={i} className="rfid-chip">
                    {id}
                  </span>
                ))}
                {admin.rfid?.length > 3 && <span> ...</span>}
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

              {/* ✅ ACTION BUTTONS */}
              <td>
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
                    setEditData({
                      rfid: (admin.rfid || []).join(", "),
                      status: admin.status,
                    });
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
        <h2>Admin Details</h2>
        <button onClick={() => setViewModal(false)}>✕</button>
      </div>

      {/* Grid Layout */}
      <div className="form-grid">

        <input value={selectedAdmin.name} disabled />
        <input value={selectedAdmin.email} disabled />

        <input value={selectedAdmin.status} disabled />

        <div className="rfid-full">
          {selectedAdmin.rfid.map((id, i) => (
            <span key={i} className="rfid-chip">{id}</span>
          ))}
        </div>

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

        <input
          name="rfid"
          placeholder="RFIDs (comma separated)"
          value={editData.rfid}
          onChange={(e) =>
            setEditData({ ...editData, rfid: e.target.value })
          }
          className="full-width"
        />

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
  {/* MODAL */} {showModal && ( <div className="modal-overlay"> 
    <div className="modal"> <div className="modal-header">
       <h2>Add New Admin</h2> <button onClick={() => setShowModal(false)}>✕</button> </div> 
       <div className="form-grid"> <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} />
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
         <input name="organization" placeholder="Organization" value={formData.organization} onChange={handleChange} /> 
         <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} /> 
         <select name="status" value={formData.status} onChange={handleChange} > 
          <option value="active">Active</option> 
          <option value="inactive">Inactive</option> 
          </select> </div> <div className="modal-actions"> 
            <button className="btn-cancel" onClick={() => setShowModal(false)} > Cancel </button>
             <button className="btn-create" onClick={handleCreateAdmin}> Create Admin </button> 
             </div> 
             </div> 
             </div> )}
              </div>
      )}
  

export default Admins;