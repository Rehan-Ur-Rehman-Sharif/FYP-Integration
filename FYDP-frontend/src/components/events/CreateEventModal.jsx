// src/components/events/CreateEventModal.jsx
import React, { useState } from "react";

export default function CreateEventModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    venue: "",
    geo: "",
    regStart: "",
    regEnd: "",
    date: "",
    description: ""
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = () => {
    if (!form.title || !form.date) {
      alert("Please enter event title and date.");
      return;
    }
    const newEvent = {
      id: "evt-" + Date.now(),
      title: form.title,
      venue: form.venue,
      date: form.date,
      regStart: form.regStart,
      regEnd: form.regEnd,
      description: form.description,
      participants: [],
      attendance: [],
      registeredCount: 0,
      qrImage: "/mnt/data/b05d9fb1-ce8a-4eb6-9e96-80f02d00d93f.png",
      registrationLink: "https://example.com/events/" + Date.now()
    };
    onCreate(newEvent);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Create New Event</h2>
          <button onClick={onClose}>✖</button>
        </div>

        <div style={{ marginTop: 12 }} className="form-grid">
          <div>
            <label>Event Name *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Enter event name"/>
          </div>

          <div>
            <label>Venue *</label>
            <input name="venue" value={form.venue} onChange={handleChange} placeholder="Enter venue"/>
          </div>

          <div>
            <label>Geo Location *</label>
            <input name="geo" value={form.geo} onChange={handleChange} placeholder="e.g., 28.6139° N, 77.2090° E"/>
          </div>

          <div>
            <label>Registration Start *</label>
            <input name="regStart" type="date" value={form.regStart} onChange={handleChange}/>
          </div>

          <div>
            <label>Registration End *</label>
            <input name="regEnd" type="date" value={form.regEnd} onChange={handleChange}/>
          </div>

          <div>
            <label>Event Date *</label>
            <input name="date" type="date" value={form.date} onChange={handleChange}/>
          </div>

          <div className="full">
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="5" placeholder="Enter event description"/>
          </div>
        </div>

        <div className="modal-create">
          <button className="btn create" onClick={handleCreate}>＋ Create Event</button>
        </div>
      </div>
    </div>
  );
}
