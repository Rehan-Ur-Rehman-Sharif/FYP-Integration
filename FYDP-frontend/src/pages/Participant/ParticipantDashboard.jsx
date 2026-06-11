import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Mail,
  MapPin,
  CalendarDays,
  Eye,
  CheckCircle2,
  CalendarX2,
  QrCode,
  X,
  Camera,
  RefreshCw,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import axiosInstance from "../../utils/axiosInstance";
import "./participant.css";

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

const FaceVerifyModal = ({ eventTitle, onClose, onSubmit, submitting, isRegistration = false }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        alert("Camera access failed. Please allow camera permissions.");
        onClose();
      }
    };

    startCamera();
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onClose]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      alert("Camera is not ready yet.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      alert("Failed to capture image. Please try again.");
      return;
    }
    setCapturedBlob(blob);
    setPreview(URL.createObjectURL(blob));
  };

  const retake = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setCapturedBlob(null);
  };

  const submit = () => {
    if (!capturedBlob) {
      alert("Please capture your face first.");
      return;
    }
    onSubmit(capturedBlob);
  };

  return (
    <div className="pqr-overlay" onClick={onClose}>
      <div className="pqr-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pqr-modal-header">
          <Camera size={20} color="#2c5f9e" />
          <span>{isRegistration ? 'Register Your Face' : 'Live Face Verification'}</span>
          <button className="pqr-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="pqr-modal-subtitle">Event: <strong>{eventTitle}</strong></p>
        <p className="pqr-modal-hint">{isRegistration ? 'Capture a live photo to register your face for this event.' : 'Capture a live photo to verify attendance.'}</p>

        {!preview ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", borderRadius: 12, background: "#000", minHeight: 250 }}
          />
        ) : (
          <img src={preview} alt="Captured face" className="pqr-preview-img" />
        )}

        <div className="pqr-modal-actions">
          <button className="pqr-cancel-btn" onClick={onClose} disabled={submitting}>Cancel</button>
          {!preview ? (
            <button className="pqr-submit-btn" onClick={capture} disabled={submitting}>
              <Camera size={14} /> Capture
            </button>
          ) : (
            <>
              <button className="pqr-reselect-btn" onClick={retake} disabled={submitting}>
                <RefreshCw size={14} /> Retake
              </button>
              <button className="pqr-submit-btn" onClick={submit} disabled={submitting}>
                {submitting ? (isRegistration ? "Registering..." : "Verifying...") : (isRegistration ? "Register Face" : "Verify & Mark")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const extractAttendanceToken = (decodedText) => {
  const text = String(decodedText || "").trim();
  if (!text) return "";

  try {
    const url = new URL(text);
    const segments = url.pathname.split("/").filter(Boolean);
    const idx = segments.indexOf("attendance-qr");
    if (idx !== -1 && segments[idx + 1]) return segments[idx + 1];
  } catch {
    // not a URL, try as plain token
  }

  if (text.includes("/") && text.split("/").filter(Boolean).length > 1) {
    return text.split("/").filter(Boolean).pop();
  }
  return text;
};

const ParticipantDashboard = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scanningEvent, setScanningEvent] = useState(null);
  const [verifyContext, setVerifyContext] = useState(null);
  const [registerFaceContext, setRegisterFaceContext] = useState(null);
  const [registeringFace, setRegisteringFace] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [participantData, setParticipantData] = useState({
    profile: { name: "", email: "" },
    upcomingEvents: [],
    pastEvents: [],
  });
  const html5QrRef = useRef(null);

  const fetchDashboard = async () => {
    setIsRefreshing(true);
    try {
      const { data } = await axiosInstance.get("/api/events/participants/dashboard/", {
        params: { _t: Date.now() }
      });
      setParticipantData({
        profile: data?.profile || { name: "", email: "" },
        upcomingEvents: Array.isArray(data?.upcomingEvents) ? data.upcomingEvents : [],
        pastEvents: Array.isArray(data?.pastEvents) ? data.pastEvents : [],
      });
    } catch (error) {
      console.error("Failed to load participant dashboard", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Auto-refresh when user focuses/switches back to this tab
    const handleFocus = () => {
      fetchDashboard();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    const pendingToken = (localStorage.getItem("pendingAttendanceToken") || "").trim();
    if (!pendingToken) return;

    const loadPendingContext = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/api/events/attendance-by-link/${encodeURIComponent(pendingToken)}/`
        );
        setVerifyContext({
          token: pendingToken,
          title: data?.title || "Scanned Event",
        });
      } catch (err) {
        console.error("Failed to load pending attendance context", err);
        const errMsg = err.response?.data
          ? (typeof err.response.data === "string" ? err.response.data : Object.values(err.response.data).flat().join(" "))
          : err.message;
        alert(`Failed to load event attendance: ${errMsg || "Unknown error"}`);
        localStorage.removeItem("pendingAttendanceToken");
      }
    };

    loadPendingContext();
  }, []);

  useEffect(() => {
    const pendingToken = (localStorage.getItem("pendingFaceRegistration") || "").trim();
    if (!pendingToken) return;

    const loadPendingContext = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/api/events/register-by-link/${encodeURIComponent(pendingToken)}/`
        );
        if (data?.alreadyRegistered) {
          alert(`You are already registered for the event "${data.title || "this event"}".`);
          localStorage.removeItem("pendingFaceRegistration");
          return;
        }
        setRegisterFaceContext({
          token: pendingToken,
          eventId: data?.eventId,
          title: data?.title || "Event Registration",
        });
      } catch (err) {
        console.error("Failed to load pending registration context", err);
        const errMsg = err.response?.data
          ? (typeof err.response.data === "string" ? err.response.data : Object.values(err.response.data).flat().join(" "))
          : err.message;
        alert(`Failed to load event registration: ${errMsg || "Unknown error"}`);
        localStorage.removeItem("pendingFaceRegistration");
      }
    };

    loadPendingContext();
  }, []);

  const { profile, upcomingEvents, pastEvents } = participantData;

  const stopScanner = async () => {
    if (!html5QrRef.current) return;
    try {
      await html5QrRef.current.stop();
      await html5QrRef.current.clear();
    } catch {
      // ignore scanner cleanup errors
    }
    html5QrRef.current = null;
  };

  const closeScanner = async () => {
    await stopScanner();
    setScanningEvent(null);
  };

  useEffect(() => {
    if (!scanningEvent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [scanningEvent]);

  useEffect(() => {
    if (!scanningEvent) return;
    const eventSnapshot = scanningEvent;

    const start = async () => {
      html5QrRef.current = new Html5Qrcode("pqr-reader");
      try {
        await html5QrRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          async (decodedText) => {
            const token = extractAttendanceToken(decodedText);
            await stopScanner();
            setScanningEvent(null);
            if (!token) {
              alert("Could not read attendance token from QR code.");
              return;
            }
            setVerifyContext({
              token,
              title: eventSnapshot?.title || "Scanned Event",
            });
          }
        );
      } catch {
        alert("Camera access failed. Please allow camera permissions.");
        closeScanner();
      }
    };

    start();
    return () => {
      stopScanner();
    };
  }, [scanningEvent]);

  const handleFaceVerifySubmit = async (imageBlob) => {
    if (!verifyContext?.token) return;
    setVerifying(true);
    try {
      const formData = new FormData();
      formData.append("face_image", imageBlob, "live-face.jpg");

      const { data } = await axiosInstance.post(
        `/api/events/attendance-by-link/${encodeURIComponent(verifyContext.token)}/`,
        formData
      );

      if (data?.is_match) {
        alert("Attendance marked successfully.");
        localStorage.removeItem("pendingAttendanceToken");
        setVerifyContext(null);
        await fetchDashboard();
      } else {
        alert("Face does not match, please try again.");
      }
    } catch (error) {
      const apiError = error?.response?.data;
      const message = apiError ? Object.values(apiError).flat().join(" ") : "";
      alert(message || "Face does not match, please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const cancelPendingRegistration = async (token) => {
    if (!token) return;
    try {
      await axiosInstance.delete(
        `/api/events/register-by-link/${encodeURIComponent(token)}/`
      );
    } catch {
      // Ignore — may not exist yet if user cancelled before any partial registration.
    }
  };

  const handleCancelFaceRegistration = async () => {
    const token = registerFaceContext?.token;
    await cancelPendingRegistration(token);
    localStorage.removeItem("pendingFaceRegistration");
    setRegisterFaceContext(null);
    await fetchDashboard();
  };

  const handleFaceRegisterSubmit = async (imageBlob) => {
    if (!registerFaceContext?.token) return;
    setRegisteringFace(true);
    try {
      const formData = new FormData();
      formData.append("face_image", imageBlob, "live-face.jpg");
      formData.append("event_token", registerFaceContext.token);

      const { data } = await axiosInstance.post(
        "/api/events/register-face/",
        formData
      );

      alert(data?.message || "Face registered successfully!");
      localStorage.removeItem("pendingFaceRegistration");
      setRegisterFaceContext(null);
      await fetchDashboard();
    } catch (error) {
      const apiError = error?.response?.data;
      const message = apiError ? Object.values(apiError).flat().join(" ") : "";
      alert(message || "Face registration failed. Please try again.");
    } finally {
      setRegisteringFace(false);
    }
  };

  return (
    <div className="participant-page">
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
        </div>
      </aside>

      <main className="participant-main">
        <div className="participant-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Attendance Management System</span>
          <button
            onClick={fetchDashboard}
            className={`participant-refresh-btn ${isRefreshing ? "spinning" : ""}`}
            title="Refresh dashboard"
            disabled={isRefreshing}
          >
            <RefreshCw size={18} />
          </button>
        </div>

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

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {scanningEvent && (
        <div className="pqr-overlay">
          <div className="pqr-scanner-box">
            <div className="pqr-scanner-header">
              <QrCode size={20} color="#2c5f9e" />
              <span>Scan QR Code</span>
              <button className="pqr-close-btn" onClick={closeScanner}><X size={18} /></button>
            </div>
            <p className="pqr-scanner-subtitle">
              Point your camera at the attendance QR code for<br />
              <strong>{scanningEvent.title}</strong>
            </p>
            <div id="pqr-reader" className="pqr-reader" />
          </div>
        </div>
      )}

      {verifyContext && (
        <FaceVerifyModal
          eventTitle={verifyContext.title}
          onClose={() => setVerifyContext(null)}
          onSubmit={handleFaceVerifySubmit}
          submitting={verifying}
        />
      )}

      {registerFaceContext && (
        <FaceVerifyModal
          eventTitle={registerFaceContext.title}
          onClose={handleCancelFaceRegistration}
          onSubmit={handleFaceRegisterSubmit}
          submitting={registeringFace}
          isRegistration={true}
        />
      )}
    </div>
  );
};

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
