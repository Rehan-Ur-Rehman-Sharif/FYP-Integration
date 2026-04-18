import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Eye,
  CheckCircle2,
  CalendarX2,
  QrCode,
  X,
  Upload,
  ImagePlus,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import participants from "../../data/ParticipantData";
import "./participant.css";

/* ─── tiny Event Detail Modal ─── */
const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "30px 32px",
          maxWidth: 460,
          width: "90%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 10, color: "#1e2a38", fontSize: 20 }}>
          {event.title}
        </h2>

        <div className="participant-card-meta" style={{ marginBottom: 6 }}>
          <MapPin size={14} />
          {event.venue}
        </div>
        <div className="participant-card-meta" style={{ marginBottom: 14 }}>
          <CalendarDays size={14} />
          {event.date}
        </div>

        <p style={{ fontSize: 14, color: "#6b7c93", lineHeight: 1.6 }}>
          {event.description}
        </p>

        {event.attended !== null && (
          <p
            style={{ marginTop: 14, fontWeight: 600, fontSize: 14 }}
            className={
              event.attended
                ? "participant-status-attended"
                : "participant-status-not-attended"
            }
          >
            {event.attended ? "✓ Attended" : "✗ Not Attended"}
          </p>
        )}

        <button
          className="participant-view-btn"
          style={{ marginTop: 18 }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* ─── Photo Upload Modal ─── */
const PhotoUploadModal = ({ eventTitle, onClose, onSubmit }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = () => {
    if (!file) { alert("Please select an image first."); return; }
    onSubmit(file);
  };

  return (
    <div className="pqr-overlay" onClick={onClose}>
      <div className="pqr-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pqr-modal-header">
          <ImagePlus size={20} color="#2c5f9e" />
          <span>Upload Attendance Photo</span>
          <button className="pqr-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="pqr-modal-subtitle">Event: <strong>{eventTitle}</strong></p>
        <p className="pqr-modal-hint">Please upload a clear photo of yourself for attendance verification.</p>

        <div
          className={`pqr-drop-zone${preview ? " pqr-drop-zone--has-file" : ""}`}
          onClick={() => inputRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" className="pqr-preview-img" />
          ) : (
            <>
              <Upload size={32} color="#a0b0c8" />
              <span>Click to choose image</span>
              <span className="pqr-drop-hint">JPG, PNG or WEBP</span>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        {preview && (
          <button
            className="pqr-reselect-btn"
            onClick={() => { setPreview(null); setFile(null); inputRef.current.click(); }}
          >
            Change Photo
          </button>
        )}
        <div className="pqr-modal-actions">
          <button className="pqr-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="pqr-submit-btn" onClick={handleSubmit}>
            <Upload size={14} /> Submit
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const ParticipantDashboard = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scanningEvent, setScanningEvent] = useState(null);
  const [uploadEvent, setUploadEvent]     = useState(null);
  const html5QrRef = useRef(null);

  /* Resolve current participant from localStorage */
  const participantData = useMemo(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return participants[0];
    const currentUser = JSON.parse(stored);
    return (
      participants.find((p) => p.profile.email === currentUser.email) ||
      participants[0]
    );
  }, []);

  const { profile, upcomingEvents, pastEvents } = participantData;

  /* ── QR scanner helpers ── */
  const stopScanner = async () => {
    if (!html5QrRef.current) return;
    try {
      await html5QrRef.current.stop();
      await html5QrRef.current.clear();
    } catch {}
    html5QrRef.current = null;
  };

  const closeScanner = async () => {
    await stopScanner();
    setScanningEvent(null);
  };

  /* Lock body scroll while scanner is open */
  useEffect(() => {
    if (!scanningEvent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [scanningEvent]);

  /* Start camera once the scanner overlay mounts */
  useEffect(() => {
    if (!scanningEvent) return;
    const eventSnapshot = scanningEvent;

    const start = async () => {
      html5QrRef.current = new Html5Qrcode("pqr-reader");
      try {
        await html5QrRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          async () => {
            await stopScanner();
            setScanningEvent(null);
            setUploadEvent(eventSnapshot);
          }
        );
      } catch {
        alert("Camera access failed. Please allow camera permissions.");
        closeScanner();
      }
    };

    start();
    return () => { stopScanner(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanningEvent]);

  const handlePhotoSubmit = (file) => {
    console.log("Attendance photo submitted:", { event: uploadEvent?.title, file });
    alert(`Photo submitted successfully for "${uploadEvent?.title}"!`);
    setUploadEvent(null);
  };

  return (
    <div className="participant-page">
      {/* ── Sidebar Profile Card ── */}
      <aside className="participant-profile-card">
        <div className="participant-profile-banner" />

        <div className="participant-avatar-wrapper">
          <User size={38} color="#5a6f8e" strokeWidth={2} />
        </div>

        <div className="participant-profile-info">
          <p className="participant-profile-name">{profile.name}</p>

          <div className="participant-profile-detail">
            <Mail size={13} />
            {profile.email}
          </div>

          <div className="participant-profile-detail">
            <Phone size={13} />
            {profile.phone}
          </div>
        </div>

      </aside>

      {/* ── Main Content ── */}
      <main className="participant-main">
        {/* Header */}
        <div className="participant-header">Attendance Management System</div>

        {/* Upcoming Events */}
        <div>
          <p className="participant-section-label">Upcoming Events</p>

          {upcomingEvents.length === 0 ? (
            <div className="participant-empty">
              <CalendarX2 size={46} color="#a0b0c8" strokeWidth={1.5} />
              <span>No upcoming events</span>
            </div>
          ) : (
            <div className="participant-events-grid">
              {upcomingEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onView={setSelectedEvent}
                  onScanQR={() => setScanningEvent(ev)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <p className="participant-section-label">Past Events</p>
            <div className="participant-events-grid">
              {pastEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onView={setSelectedEvent}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* QR Scanner Overlay */}
      {scanningEvent && (
        <div className="pqr-overlay">
          <div className="pqr-scanner-box">
            <div className="pqr-scanner-header">
              <QrCode size={20} color="#2c5f9e" />
              <span>Scan QR Code</span>
              <button className="pqr-close-btn" onClick={closeScanner}><X size={18} /></button>
            </div>
            <p className="pqr-scanner-subtitle">
              Point your camera at the event QR code for<br />
              <strong>{scanningEvent.title}</strong>
            </p>
            <div id="pqr-reader" className="pqr-reader" />
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {uploadEvent && (
        <PhotoUploadModal
          eventTitle={uploadEvent.title}
          onClose={() => setUploadEvent(null)}
          onSubmit={handlePhotoSubmit}
        />
      )}
    </div>
  );
};

/* ─── Event Card sub-component ─── */
const EventCard = ({ event, onView, onScanQR }) => (
  <div className="participant-event-card">
    <div className="participant-card-top">
      <h3 className="participant-card-title">{event.title}</h3>

      <span className="participant-card-status-icon">
        {event.attended === true && (
          <CheckCircle2 size={20} color="#22a06b" strokeWidth={2} />
        )}
        {event.attended === false && (
          <Eye size={20} color="#ae2a19" strokeWidth={2} />
        )}
      </span>
    </div>

    <div className="participant-card-meta">
      <MapPin size={13} />
      {event.venue}
    </div>

    <div className="participant-card-meta">
      <CalendarDays size={13} />
      {event.date}
    </div>

    <p className="participant-card-desc">{event.description}</p>

    <div className="participant-card-footer">
      <button
        className="participant-view-btn"
        onClick={() => onView(event)}
      >
        <Eye size={13} /> View
      </button>

      {event.attended === null && onScanQR && (
        <button className="pqr-scan-btn" onClick={onScanQR}>
          <QrCode size={13} /> Scan QR
        </button>
      )}
      {event.attended === true && (
        <span className="participant-status-attended">Attended</span>
      )}
      {event.attended === false && (
        <span className="participant-status-not-attended">Not Attended</span>
      )}
    </div>
  </div>
);

export default ParticipantDashboard;
