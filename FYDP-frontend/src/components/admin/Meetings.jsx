import React, { useState } from "react";
import orgAdminData from "../../data/OrgAdminData";

const Meetings = () => {
  const [meetings, setMeetings] = useState(orgAdminData.meetings);

  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [editData, setEditData] = useState({
    date: "",
    time: "",
    status: "",
  });

  // ✅ DELETE
  const handleDelete = (id) => {
    if (!window.confirm("Delete this meeting?")) return;

    const updated = meetings.filter((m) => m.id !== id);
    setMeetings(updated);
  };

  // ✅ UPDATE
  const handleUpdate = () => {
    const updated = meetings.map((m) =>
      m.id === selectedMeeting.id
        ? {
            ...m,
            date: editData.date,
            time: editData.time,
            status: editData.status,
          }
        : m
    );

    setMeetings(updated);
    setEditModal(false);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Meeting Requests</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th>Organization</th>
            <th>Email</th>
            <th>Role</th>
            <th>Purpose</th>
            <th>Preferred Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {meetings.map((meeting) => (
            <tr key={meeting.id}>
              <td>{meeting.organization}</td>
              <td>{meeting.email}</td>
              <td>{meeting.role}</td>
              <td>{meeting.purpose}</td>
              <td>{meeting.date}</td>
              <td>{meeting.time}</td>

              <td>
                <span className={`status ${meeting.status.toLowerCase()}`}>
                  {meeting.status}
                </span>
              </td>

              {/* ACTIONS */}
              <td className="actions">
                <button
                  className="btn-view"
                  onClick={() => {
                    setSelectedMeeting(meeting);
                    setViewModal(true);
                  }}
                >
                  View
                </button>

                <button
                  className="btn-edit"
                  onClick={() => {
                    setSelectedMeeting(meeting);
                    setEditData({
                      date: meeting.date,
                      time: meeting.time,
                      status: meeting.status,
                    });
                    setEditModal(true);
                  }}
                >
                  Update
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(meeting.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ VIEW MODAL */}
      {viewModal && selectedMeeting && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h2>Meeting Details</h2>
              <button onClick={() => setViewModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <input value={selectedMeeting.organization} disabled />
              <input value={selectedMeeting.email} disabled />
              <input value={selectedMeeting.role} disabled />
              <input value={selectedMeeting.purpose} disabled />
              <input value={selectedMeeting.date} disabled />
              <input value={selectedMeeting.time} disabled />
              <input value={selectedMeeting.status} disabled />
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
      {editModal && selectedMeeting && (
        <div className="modal-overlay">
          <div className="modal">

            <div className="modal-header">
              <h2>Update Meeting</h2>
              <button onClick={() => setEditModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <input value={selectedMeeting.organization} disabled />
              <input value={selectedMeeting.email} disabled />

              {/* Editable Fields */}
              <input
                type="date"
                value={editData.date}
                onChange={(e) =>
                  setEditData({ ...editData, date: e.target.value })
                }
              />

              <input
                type="time"
                value={editData.time}
                onChange={(e) =>
                  setEditData({ ...editData, time: e.target.value })
                }
              />

              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
                className="full-width"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
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

export default Meetings;