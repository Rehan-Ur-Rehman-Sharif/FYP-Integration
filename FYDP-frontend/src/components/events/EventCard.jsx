// src/components/events/EventCard.jsx
import React from "react";
import { Calendar } from "lucide-react";
import { MapPin } from "lucide-react";
import { UserPlus } from "lucide-react";
import { Link } from "lucide-react";

export default function EventCard({ event, onView, onCopyLink }) {
  return (
    <div className="event-card" role="article">
      <h3>{event.title}</h3>

      <div className="meta">
        <div className="new"> 
<MapPin size={20} color="#2C5F9E" strokeWidth={2.5} />{event.venue}</div>
        <div  className="new"><Calendar size={20} color="#2C5F9E" strokeWidth={2.5} /> {new Date(event.date).toLocaleDateString()}</div>
        <div className="new"><UserPlus size={20} color="#2C5F9E" /> {event.registeredCount} registered</div>
      </div>

      <div className="event-desc">{event.description}</div>

      <div className="card-actions">
      <button className="small-btn" onClick={() => onCopyLink(event)}>  
          <Link size={22} color="#2C5F9E" strokeWidth={2.5} /> Copy Link
        </button>
       

        <button className="small-btn primary" onClick={() => onView(event)}>
           View
        </button>
      </div>
    </div>
  );
}
