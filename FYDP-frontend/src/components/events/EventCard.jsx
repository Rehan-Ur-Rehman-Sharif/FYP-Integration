// src/components/events/EventCard.jsx
import React from "react";

export default function EventCard({ event, onView, onCopyLink }) {
  return (
    <div className="event-card" role="article">
      <h3>{event.title}</h3>

      <div className="meta">
        <div>📍 {event.venue}</div>
        <div>📅 {new Date(event.date).toLocaleDateString()}</div>
        <div>👥 {event.registeredCount} registered</div>
      </div>

      <div className="event-desc">{event.description}</div>

      <div className="card-actions">
        <button className="small-btn" onClick={() => onCopyLink(event)}>
          🔗 Copy Link
        </button>

        <button className="small-btn primary" onClick={() => onView(event)}>
           View
        </button>
      </div>
    </div>
  );
}
