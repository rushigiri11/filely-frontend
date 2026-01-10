import { useState } from "react";
import { uploadFile } from "../api";
import "./Upload.css";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [expiry, setExpiry] = useState(10);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
    const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: ""
    });
    const showPopup = (title, message) => {
    setPopup({ open: true, title, message });
    };

  const handleUpload = async () => {
    if (!file) {
    return showPopup(
        "No file selected",
        "Please choose a file before uploading."
    );
    }
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiryMinutes", expiry);

      const res = await uploadFile(formData);
      setCode(res.data.code);
    } catch {
        showPopup(
        "Upload failed",
        "Something went wrong. Please try again."
        );    
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const directLink = code
  ? `${window.location.origin}/d/${code}`
  : "";


  return (
    <div className="page">
      <div className="card">
        <h1 className="logo">📤 Filely</h1>
        <p className="subtitle">Privacy-first file sharing</p>

        {/* File picker */}
        <label className="file-box">
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file ? file.name : "Click to choose a file"}
        </label>

        {/* Expiry dropdown */}
        <select
          className="select"
          value={expiry}
          onChange={(e) => setExpiry(Number(e.target.value))}
        >
          <option value={5}>Expires in 5 minutes</option>
          <option value={10}>Expires in 10 minutes</option>
          <option value={20}>Expires in 20 minutes</option>
          <option value={30}>Expires in 30 minutes</option>
          <option value={60}>Expires in 60 minutes</option>
        </select>

        {/* Upload button */}
        <button
          className="primary-btn"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload File"}
        </button>

        {/* Code box */}
        {code && (
          <div className="code-box">
            <p className="code-label">Your access code</p>

            <div className="code-row">
              <h2>{code}</h2>
              <button className="copy-btn" onClick={copyCode}>
                {copied ? "✔ Copied" : "📋 Copy"}
              </button>
            </div>

            <p className="code-hint">
              Share this code to download the file
            </p>

            {/* 🔗 Direct link */}
            <div style={{ marginTop: 15 }}>
              <p className="code-label">Direct link</p>

              <div className="code-row">
                <small style={{ wordBreak: "break-all" }}>
                  {directLink}
                </small>

                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(directLink);
                    showPopup("Copied", "Direct link copied to clipboard");
                  }}
                >
                  🔗 Copy link
                </button>
              </div>
            </div>
          </div>
        )}


        <div className="divider" />

        {/* Navigate to access */}
        <button
          className="secondary-btn"
          onClick={() => (window.location.href = "/access")}
        >
          🔑 Access a File
        </button>
      </div>

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
