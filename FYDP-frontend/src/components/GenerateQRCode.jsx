import React from "react";

const QRGenerator = ({ qrCode, qrToken, session, loading, error }) => {
  if (loading) {
    return <p style={{ textAlign: "center" }}>Generating QR...</p>;
  }

  if (error) {
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  }

  if (!qrCode) {
    return <p style={{ textAlign: "center" }}>No QR generated yet.</p>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <img
        src={qrCode}
        alt="Attendance session QR"
        style={{ width: 300, height: 300, margin: "auto", display: "block" }}
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
        {JSON.stringify(
          {
            session_id: session?.id,
            status: session?.status,
            teacher: session?.teacher_name,
            course: session?.course_name,
            qr_token: qrToken,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
};

export default QRGenerator;
