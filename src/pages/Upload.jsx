import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { fetchUploadStats, uploadFile } from "../api";
import "./glass.css";
import "./Upload.css";

const MAX_FILES = 15;
const SUCCESS_NOTICE_DURATION = 5;

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function Upload() {
  const navigate = useNavigate();
  const stepTwoRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [expiry, setExpiry] = useState(10);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [totalUploads, setTotalUploads] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(0);
  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: ""
  });

  const showPopup = (title, message) => {
    setPopup({ open: true, title, message });
  };

  useEffect(() => {
    fetchUploadStats()
      .then((res) => res.data)
      .then((data) => {
        if (data.success) {
          setTotalUploads(data.totalUploads);
        }
      })
      .catch((err) => console.log("Stats error:", err));
  }, []);

  const directLink = useMemo(
    () => (uploadResult ? `${window.location.origin}/d/${uploadResult.code}` : ""),
    [uploadResult]
  );

  useEffect(() => {
    if (!directLink) {
      setQrCodeUrl("");
      return;
    }

    QRCode.toDataURL(directLink, {
      margin: 1,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#f8fafc"
      }
    })
      .then((dataUrl) => setQrCodeUrl(dataUrl))
      .catch((err) => console.log("QR error:", err));
  }, [directLink]);

  useEffect(() => {
    if (!successCountdown) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [successCountdown]);

  useEffect(() => {
    if (!uploadResult || !window.matchMedia("(max-width: 980px)").matches) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      stepTwoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [uploadResult]);

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length > MAX_FILES) {
      event.target.value = "";
      return showPopup(
        "Too many files",
        `Please select up to ${MAX_FILES} files in one upload.`
      );
    }

    setSelectedFiles(nextFiles);
    setUploadResult(null);
    setCopiedCode(false);
    setCopiedLink(false);
    setSuccessCountdown(0);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      return showPopup(
        "No files selected",
        "Choose at least one file before uploading."
      );
    }

    try {
      setLoading(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("expiryMinutes", expiry);

      const res = await uploadFile(formData);
      const nextTotalUploads =
        totalUploads + (res.data.fileCount || selectedFiles.length);

      setUploadResult({
        code: res.data.code,
        fileCount: res.data.fileCount,
        expiresIn: res.data.expiresIn
      });
      setTotalUploads(nextTotalUploads);
      setSuccessCountdown(SUCCESS_NOTICE_DURATION);
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        "Something went wrong. Please try again.";

      showPopup("Upload failed", message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!uploadResult?.code) {
      return;
    }

    await navigator.clipboard.writeText(uploadResult.code);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1500);
  };

  const copyLink = async () => {
    if (!directLink) {
      return;
    }

    await navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="glass-page glass-page-upload">
        <section className="hero-card upload-topbar">
          <div className="brand-lockup">
            <h1>Filely</h1>
            <p>Privacy-first file sharing platform.</p>
          </div>
          <button
            className="ghost-action topbar-action"
            onClick={() => navigate("/access")}
          >
            Open download page
          </button>
        </section>

        <div className="glass-grid">
          <section className="glass-card">
            <div className="section-head">
              <div>
                <span className="section-kicker">Step 1</span>
                <h2>Choose your files</h2>
              </div>
              <span className="count-chip">
                {selectedFiles.length}/{MAX_FILES}
              </span>
            </div>

            <label className="dropzone">
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileChange}
              />
              <span className="dropzone-title">
                {selectedFiles.length ? "Change selected files" : "Select files"}
              </span>
              <span className="dropzone-copy">
                Drag, tap, or click to pick files from any device
              </span>
            </label>

            {selectedFiles.length > 0 && (
              <div className="file-list">
                {selectedFiles.map((file) => (
                  <article
                    className="file-row"
                    key={`${file.name}-${file.lastModified}`}
                  >
                    <div>
                      <strong>{file.name}</strong>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="control-stack">
              <label className="field-group">
                <span>Link expiry</span>
                <select
                  className="glass-input"
                  value={expiry}
                  onChange={(e) => setExpiry(Number(e.target.value))}
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </label>

              <button
                className="primary-action"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "Uploading files..." : "Upload files"}
              </button>
            </div>

          </section>

          <section className="glass-card" ref={stepTwoRef}>
            <div className="section-head">
              <div>
                <span className="section-kicker">Step 2</span>
                <h2>Share instantly</h2>
              </div>
            </div>

            {successCountdown > 0 && uploadResult && (
              <div className="success-banner">
                <div>
                  <strong>Upload complete</strong>
                  <span>
                    Ready to share. This notice closes in {successCountdown}s.
                  </span>
                </div>
                <div className="success-meta">
                  <span>{uploadResult.fileCount} files</span>
                  <span>{totalUploads.toLocaleString()} shared total</span>
                </div>
              </div>
            )}

            {uploadResult ? (
              <div className="share-stack">
                <div className="share-card">
                  <span className="muted-label">Access code</span>
                  <div className="share-row">
                    <strong className="share-code">{uploadResult.code}</strong>
                    <button className="secondary-action" onClick={copyCode}>
                      {copiedCode ? "Copied" : "Copy code"}
                    </button>
                  </div>
                </div>

                <div className="share-card">
                  <span className="muted-label">Direct link</span>
                  <div className="share-row share-row-link">
                    <small>{directLink}</small>
                    <button className="secondary-action" onClick={copyLink}>
                      {copiedLink ? "Copied" : "Copy link"}
                    </button>
                  </div>
                </div>

                <div className="summary-grid">
                  <div className="summary-card">
                    <span>Files in this upload</span>
                    <strong>{uploadResult.fileCount}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Expires in</span>
                    <strong>{uploadResult.expiresIn}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Total files shared</span>
                    <strong>{totalUploads.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="action-row">
                  <button
                    className="secondary-action secondary-action-wide"
                    onClick={() => setIsQrOpen(true)}
                    disabled={!qrCodeUrl}
                  >
                    Show QR
                  </button>
                  <button
                    className="ghost-action"
                    onClick={() => navigate(`/download/${uploadResult.code}`)}
                  >
                    Preview download page
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-panel">
                <h3>Upload details will appear here</h3>
                <p>
                  After upload, you will get the code, the direct link, a QR
                  code button, and a running total of every file shared so far.
                </p>
              </div>
            )}

          </section>
        </div>

        <section className="glass-card info-card">
          <div className="section-head info-card-head">
            <div>
              <span className="section-kicker">Privacy-first sharing</span>
              <h2>Why people use Filely</h2>
            </div>
          </div>

          <div className="info-card-grid">
            <div className="info-card-stack">
              <div className="stat-pill stat-pill-light">
                <span>Total files shared</span>
                <strong>{totalUploads.toLocaleString()}</strong>
              </div>
              <div className="stat-pill stat-pill-light">
                <span>Batch limit</span>
                <strong>{MAX_FILES} files</strong>
              </div>
            </div>

            <div className="feature-list-card">
              <ul className="feature-list">
                <li>No phone number revealed while sharing files.</li>
                <li>No login, signup, or account needed.</li>
                <li>Files auto-expire for more private sharing.</li>
                <li>More private than WhatsApp, Drive, or email.</li>
                <li>Share by code, direct link, or QR scan.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {isQrOpen && (
        <div className="overlay">
          <div className="modal-card qr-modal">
            <div className="modal-head">
              <div>
                <span className="section-kicker">Scan to download</span>
                <h3>QR for your shared link</h3>
              </div>
              <button
                className="icon-close"
                onClick={() => setIsQrOpen(false)}
                aria-label="Close QR dialog"
              >
                ×
              </button>
            </div>

            {qrCodeUrl && (
              <img className="qr-image" src={qrCodeUrl} alt="QR code for the shared link" />
            )}

            <p className="qr-copy">
              Scan this code from another phone, tablet, or laptop to open the
              download page instantly.
            </p>

            <button className="primary-action" onClick={() => setIsQrOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}

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
