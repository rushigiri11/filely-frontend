import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { downloadByCode } from "../api";
import "./Download.css";

export default function Download() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    downloadByCode(code)
      .then((res) => setData(res.data))
      .catch(() => setError("Invalid or expired link"));
  }, [code]);

  if (error) {
    return (
      <div className="download-page">
        <div className="download-card">
          <h2>❌ {error}</h2>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="download-page">
        <div className="download-card">
          <h2>⏳ Preparing your file…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="download-page">
      <div className="download-card">
        <h1>📥 Download</h1>

        <p className="file-name">{data.fileName}</p>

        <a
          href={data.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="download-btn"
        >
          Download File
        </a>

        <p className="hint">
          Link valid until expiry
        </p>
      </div>
    </div>
  );
}
