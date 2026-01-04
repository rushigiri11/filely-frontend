import { useState } from "react";
import { uploadFile } from "../api";
import "./Upload.css";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [expiry, setExpiry] = useState(10);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiryMinutes", expiry);

      const res = await uploadFile(formData);
      setCode(res.data.code);
    } catch {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
            <p className="code-label">Your 6-digit access code</p>

            <div className="code-row">
              <h2>{code}</h2>
              <button className="copy-btn" onClick={copyCode}>
                {copied ? "✔ Copied" : "📋 Copy"}
              </button>
            </div>

            <p className="code-hint">
              Share this code to download the file
            </p>
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
    </div>
  );
}
