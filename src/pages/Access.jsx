import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Access.css";

export default function Access() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleDownload = () => {
    if (!code.trim()) return alert("Please enter access code");
    navigate(`/download/${code}`);
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="logo">🔑 Filely</h1>
        <p className="subtitle">Enter access code to download file</p>

        <input
          className="input"
          placeholder="Enter file code"
          value={code}
          maxLength={10}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
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
    </div>
  );
}
