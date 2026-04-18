// src/pages/EventAdminDashboard.jsx
import React, { useState } from "react";
import eventsData from "../data/EventData";
import EventCard from "../components/events/EventCard";
import CreateEventModal from "../components/events/CreateEventModal";
import EventModal from "../components/events/EventModal";
import "../styles/eventAdmin.css";
import { Calendar } from "lucide-react";


export default function EventAdminDashboard() {
  // keep local in-memory events (start from dummy)
  const [events, setEvents] = useState(eventsData);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleCreate = (newEv) => {
    setEvents((prev) => [newEv, ...prev]);
  };

  const handleView = (ev) => setSelectedEvent(ev);
  const handleCloseModal = () => setSelectedEvent(null);

  const handleCopyLink = (ev) => {
    navigator.clipboard?.writeText(ev.registrationLink);
    alert("Link copied to clipboard");
  };

  return (
    

      <div className="event-admin">
        <div className="header-row">
          <div className="header-left">
            <div className="header-icon">
              <Calendar size={28} color="#6b7c93" strokeWidth={2.5} />
            </div>

            <div className="header-title">
              <h1>Event Admin Dashboard</h1>
              <p>Manage events and registrations</p>
            </div>
          </div>

          <div className="top-actions">
            <button
              className="btn create"
              onClick={() => setShowCreate(true)}
            >
              ＋ Create Event
            </button>
          </div>
        </div>

        <div className="card-grid">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              onView={handleView}
              onCopyLink={handleCopyLink}
            />
          ))}
        </div>

        {showCreate && (
          <CreateEventModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}

        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={handleCloseModal}
          />
        )}
      </div>

  );
}