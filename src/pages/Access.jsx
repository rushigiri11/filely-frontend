import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./glass.css";
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
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="glass-page access-page">
        <section className="hero-card access-hero">
          <div className="brand-lockup access-brand">
            <h1>Filely</h1>
            <p>Privacy-first file sharing platform.</p>
          </div>
        </section>

        <section className="glass-card access-card">
          <div className="section-head">
            <div>
              <span className="section-kicker">Access code</span>
              <h2>Open your shared file set</h2>
            </div>
          </div>

          <input
            className="glass-input access-input"
            placeholder="Enter 6-digit code"
            value={code}
            maxLength={6}
            inputMode="numeric"
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          />

          <div className="access-actions">
            <button className="primary-action" onClick={handleDownload}>
              Open files
            </button>
            <button className="ghost-action access-back" onClick={() => navigate("/")}>
              Back to upload
            </button>
          </div>

          <div className="access-help">
            <div className="help-card">
              <strong>Private by design</strong>
              <span>
                No phone number is revealed, no account is required, and shared
                files can expire automatically.
              </span>
            </div>
          </div>
        </section>
      </main>

      {popup.open && (
        <div className="overlay">
          <div className="modal-card">
            <h3>{popup.title}</h3>
            <p>{popup.message}</p>
            <button
              className="primary-action"
              onClick={() => setPopup((current) => ({ ...current, open: false }))}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
