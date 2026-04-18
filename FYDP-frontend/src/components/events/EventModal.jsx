// src/components/events/EventModal.jsx
import React, { useState } from "react";
import { User } from "lucide-react";

export default function EventModal({ event, onClose }) {
  const [tab, setTab] = useState("details"); // details | participants | attendance

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2 style={{ fontWeight: "bold", fontSize: 24 }}>{event.title}</h2>
            <div style={{ color: "#777", marginTop: 6 }}>Event details and management</div>
          </div>
          <button onClick={onClose}>✖</button>
        </div>

        <div className="modal-tabs">
          <div className={`event-modal-tab ${tab === "details" ? "active" : ""}`} onClick={() => setTab("details")}>
            Details &amp; QR
          </div>
          <div className={`event-modal-tab ${tab === "participants" ? "active" : ""}`} onClick={() => setTab("participants")}>
            Participants ({event.participants?.length || 0})
          </div>
          <div className={`event-modal-tab ${tab === "attendance" ? "active" : ""}`} onClick={() => setTab("attendance")}>
            Attendance ({event.attendance?.length || 0})
          </div>
        </div>

        <div className="modal-grid">
          <div className="left-col">
            {tab === "details" && (
              <>
                <div style={{ marginTop: 12 }}>
                  <label>Venue</label>
                  <p>{event.venue}</p>

                  <label>Geo location</label>
                  <p>{event.geo || "—"}</p>

                  <label>Registration Period</label>
                  <p>{event.regStart} - {event.regEnd}</p>

                  <label>Event Date</label>
                  <p>{event.date}</p>

                  <label>Description</label>
                  <p style={{ color: "#444" }}>{event.description}</p>

                  <label>Registration Link</label>
                  <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input readOnly value={event.registrationLink} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #eee", background: "#fafafa" }} />
                    <button className="small-btn" onClick={() => navigator.clipboard?.writeText(event.registrationLink)}>Copy</button>
                  </p>
                </div>
              </>
            )}

            {tab === "participants" && (
              <>
                <div className="table-scroll">
                  <table className="participants-table">
                    <thead>
                      <tr><th>Photo</th><th>Name</th><th>Email</th><th>Phone</th><th>Age</th></tr>
                    </thead>
                    <tbody>
                      {event.participants?.map(p => (
                        <tr key={p.id}>
                          <td><User size={23} color="#2c4d82" strokeWidth={2.5} /></td>
                          <td>{p.name}</td>
                          <td>{p.email}</td>
                          <td>{p.phone}</td>
                          <td>{p.age}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === "attendance" && (
              <>
                <div className="table-scroll">
                  <table className="participants-table">
                    <thead>
                      <tr><th>Name</th><th>Status</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                      {event.attendance?.map((a, idx) => {
                        const part = event.participants?.find(p => p.id === a.id) || { name: "Unknown" };
                        return (
                          <tr key={idx}>
                            <td>{part.name}</td>
                            <td style={{ color: a.status === "present" ? "green" : "red" }}>{a.status}</td>
                            <td>{a.time}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="right-col">
            {tab === "details" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Attendance QR Code</div>
                  <div style={{ border: "2px solid #f0e6e6", padding: 8, borderRadius: 8 }}>
                    <img src={event.qrImage} alt="QR" style={{ width: "100%", borderRadius: 6 }} />
                  </div>
                  <div style={{ marginTop: 8, color: "#777", fontSize: 13 }}>Participants scan this QR code to mark attendance</div>
                </div>
              </>
            )}

            {tab === "participants" && (
              <div>
                <div style={{ fontWeight: 700 }}>Total participants</div>
                <div style={{ marginTop: 8, fontSize: 18 }}>{event.participants?.length || 0}</div>
              </div>
            )}

            {tab === "attendance" && (
              <div>
                <div style={{ fontWeight: 700 }}>Total Present</div>
                <div style={{ marginTop: 8, fontSize: 18 }}>{event.attendance?.filter(a => a.status === "present").length || 0}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
