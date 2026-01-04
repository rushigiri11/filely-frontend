import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Access.css";

export default function Access() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: ""
  });

  const showPopup = (title, message) => {
    setPopup({ open: true, title, message });
  };

  const handleDownload = () => {
    if (!code.trim()) {
      return showPopup(
        "Missing code",
        "Please enter the 6-digit access code to continue."
      );
    }

    navigate(`/download/${code}`);
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="logo">🔑 Filely</h1>
        <p className="subtitle">Enter access code to download file</p>

        <input
          className="input"
          placeholder="Enter 6-digit code"
          value={code}
          maxLength={6}
          inputMode="numeric"
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, ""))
          }
        />

        <button className="primary-btn" onClick={handleDownload}>
          Download File
        </button>

        <div className="divider" />

        <button
          className="secondary-btn"
          onClick={() => navigate("/")}
        >
          ⬅ Back to Upload
        </button>
      </div>

      {/* 🔔 Popup */}
      {popup.open && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>{popup.title}</h3>
            <p>{popup.message}</p>

            <button
              className="primary-btn"
              onClick={() => setPopup({ ...popup, open: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
