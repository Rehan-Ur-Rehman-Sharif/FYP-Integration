import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";

const QRGenerator = ({ course, batch, program, type, slots, geo }) => {
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!course || !batch || !program || !type || !slots) {
      setError("All fields are required to generate QR");
      return;
    }

    if (!geo.lat || !geo.lng) {
      setError("Waiting for geolocation...");
      return;
    }

    const qrPayload = {
      course,
      batch,
      program,
      type,
      slots,
      date: new Date().toISOString(),
      geoLocation: {
        lat: geo.lat,
        lng: geo.lng,
        radius: 50, // meters
      },
    };

    setQrData(qrPayload);
    setError("");
  }, [course, batch, program, type, slots, geo]);

  if (error) {
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  }

  if (!qrData) {
    return <p style={{ textAlign: "center" }}>Generating QR...</p>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <QRCode
        value={JSON.stringify(qrData)}
        size={300}
        level="H"
        bgColor="#ffffff"
        fgColor="#000000"
        style={{ margin: "auto" }}
      />
      <pre
        style={{
          textAlign: "left",
          background: "#f4f4f4",
          padding: 10,
          borderRadius: 6,
          marginTop: 15,
          display: "inline-block",
          fontSize: 12,
        }}
      >
        {JSON.stringify(qrData, null, 2)}
      </pre>
    </div>
  );
};

export default QRGenerator;
