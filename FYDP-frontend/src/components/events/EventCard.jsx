// src/components/events/EventCard.jsx
import React from "react";
import { Calendar } from "lucide-react";
import { MapPin } from "lucide-react";
import { UserPlus } from "lucide-react";
import { Link } from "lucide-react";
import { Trash2 } from "lucide-react";

export default function EventCard({ event, onView, onCopyLink, onDelete }) {
  const formattedDate = event.date ? new Date(event.date).toLocaleDateString() : "N/A";
  const isUpcoming = Boolean(event.isUpcoming);
  return (
    <div className="event-card" role="article">
      <h3>{event.title}</h3>

      <div className="meta">
        <div className="new"> 
<MapPin size={20} color="#2C5F9E" strokeWidth={2.5} />{event.venue}</div>
        <div  className="new"><Calendar size={20} color="#2C5F9E" strokeWidth={2.5} /> {formattedDate}</div>
        <div className="new"><UserPlus size={20} color="#2C5F9E" /> {event.registeredCount} registered</div>
      </div>

      <div className="event-desc">{event.description && event.description.trim() ? event.description : "\u00A0"}</div>

      <div className="card-actions">
        {isUpcoming ? (
          <button className="small-btn" onClick={() => onCopyLink(event)}>
            <Link size={22} color="#2C5F9E" strokeWidth={2.5} /> Copy Link
          </button>
        ) : (
          <button className="small-btn" disabled title="Past events cannot be shared">
            Event Closed
          </button>
        )}

        <button className="small-btn primary" onClick={() => onView(event)}>
           View
        </button>

        <button 
          className="small-btn" 
          style={{ color: "#dc2626", borderColor: "#dc2626" }}
          onClick={() => onDelete(event.id)}
          title="Delete event"
        >
          <Trash2 size={18} /> Delete
        </button>
      </div>
    </div>
  );
}
