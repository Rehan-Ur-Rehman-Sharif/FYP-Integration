// src/pages/EventAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "../components/events/EventCard";
import CreateEventModal from "../components/events/CreateEventModal";
import EventModal from "../components/events/EventModal";
import "../styles/eventAdmin.css";
import { Calendar } from "lucide-react";
import axiosInstance from "../utils/axiosInstance";

const resolveEventPk = (id) => {
  if (id === null || id === undefined) return null;
  const text = String(id).trim();
  if (!text) return null;
  if (text.startsWith("evt-")) return text.slice(4);
  return text;
};

export default function EventAdminDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      const { data } = await axiosInstance.get("/api/events/events/");
      const list = Array.isArray(data) ? data : data?.results || [];
      setEvents(list);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch events", err);
      const errMsg = err.response?.data 
        ? Object.values(err.response.data).flat().join(" ") 
        : err.message;
      setError(errMsg || "Failed to load events");
      setEvents([]);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      navigate("/login");
      return;
    }

    try {
      const currentUser = JSON.parse(stored);
      if (currentUser.role !== "advisor") {
        navigate("/login");
        return;
      }
    } catch (e) {
      localStorage.removeItem("currentUser");
      navigate("/login");
      return;
    }

    fetchEvents();
  }, [navigate]);

  useEffect(() => {
    const onAuthChange = () => {
      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        navigate("/login");
        return;
      }
      try {
        const currentUser = JSON.parse(stored);
        if (currentUser.role !== "advisor") {
          navigate("/login");
          return;
        }
      } catch (e) {
        localStorage.removeItem("currentUser");
        navigate("/login");
        return;
      }
      fetchEvents();
    };

    window.addEventListener("storage", onAuthChange);
    return () => window.removeEventListener("storage", onAuthChange);
  }, [navigate]);

  const handleCreate = async (payload) => {
    try {
      const { data } = await axiosInstance.post("/api/events/events/", payload);
      setEvents((prev) => [data, ...prev]);
      setShowCreate(false);
    } catch (error) {
      const message = error?.response?.data
        ? Object.values(error.response.data).flat().join(" ")
        : "Failed to create event.";
      alert(message || "Failed to create event.");
    }
  };

  const handleView = (ev) => setSelectedEvent(ev);
  const handleCloseModal = () => setSelectedEvent(null);

  const handleDelete = async (eventId) => {
    const pk = resolveEventPk(eventId);
    if (!pk) {
      alert("Invalid event id. Refresh the page and try again.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this event? This will also delete all registrations and attendance records.");
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/events/events/${pk}/`);
      setEvents((prev) => prev.filter((ev) => resolveEventPk(ev.id) !== pk));
      if (selectedEvent && resolveEventPk(selectedEvent.id) === pk) {
        setSelectedEvent(null);
      }
      alert("Event deleted successfully.");
    } catch (error) {
      const data = error?.response?.data;
      let message = "Failed to delete event.";
      if (typeof data === "string") {
        message = data;
      } else if (data?.detail) {
        message = data.detail;
      } else if (data) {
        message = Object.values(data).flat().join(" ");
      }
      alert(message);
      await fetchEvents();
    }
  };

  const handleCopyLink = (ev) => {
    if (!ev.isUpcoming) {
      alert("This event is closed. Past events cannot be shared.");
      return;
    }
    
    // Fallback for non-secure contexts (HTTP + IP address)
    const link = ev.registrationLink;
    if (navigator.clipboard && window.location.protocol === 'https:') {
      navigator.clipboard.writeText(link).then(() => {
        alert("Link copied to clipboard");
      });
    } else {
      // Fallback for HTTP or IP address access
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("Link copied to clipboard");
      } catch (err) {
        // Last resort - show the link so user can copy manually
        prompt("Copy this registration link:", link);
      }
      document.body.removeChild(textArea);
    }
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

        {error && (
          <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div className="card-grid">
          {events.length === 0 && !error && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#6b7c93" }}>
              No events found. Create your first event to get started.
            </div>
          )}
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              onView={handleView}
              onCopyLink={handleCopyLink}
              onDelete={handleDelete}
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