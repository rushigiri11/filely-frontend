import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  downloadAllFiles,
  downloadSingleFile,
  fetchDownloadBundle
} from "../api";
import "./glass.css";
import "./Download.css";

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

function triggerBrowserDownload(url, fileName) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

async function downloadFileFromSignedUrl(url, fileName) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  try {
    triggerBrowserDownload(objectUrl, fileName);
  } finally {
    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 1000);
  }
}

export default function Download() {
  const { code } = useParams();
  const [bundle, setBundle] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFileId, setActiveFileId] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isQrOpen, setIsQrOpen] = useState(false);

  const directLink = useMemo(
    () => `${window.location.origin}/d/${code}`,
    [code]
  );

  useEffect(() => {
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
    let cancelled = false;

    setLoading(true);
    setLoadError("");
    setActionError("");

    fetchDownloadBundle(code)
      .then((res) => {
        if (!cancelled) {
          setBundle(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.response?.data?.error || "Invalid or expired link");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleSingleDownload = async (fileId) => {
    try {
      setActionError("");
      setActiveFileId(fileId);
      const res = await downloadSingleFile(code, fileId);
      await downloadFileFromSignedUrl(
        res.data.downloadUrl,
        res.data.fileName
      );
    } catch (err) {
      setActionError(err?.response?.data?.error || "Unable to download file");
    } finally {
      setActiveFileId("");
    }
  };

  const handleDownloadAll = async () => {
    try {
      setActionError("");
      setDownloadingAll(true);
      const res = await downloadAllFiles(code);
      const failedFiles = [];

      for (const file of res.data.files) {
        try {
          await downloadFileFromSignedUrl(file.downloadUrl, file.fileName);
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        } catch {
          failedFiles.push(file.fileName);
        }
      }

      if (failedFiles.length) {
        setActionError(
          `Some files could not be downloaded: ${failedFiles.join(", ")}`
        );
      }
    } catch (err) {
      setActionError(err?.response?.data?.error || "Unable to download files");
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <main className="glass-page download-page">
          <section className="hero-card download-topbar">
            <div className="brand-lockup download-brand">
              <h1>Filely</h1>
              <p>Privacy-first file sharing platform.</p>
            </div>
          </section>

          <section className="glass-card download-main">
            <span className="section-kicker">Preparing files</span>
            <h2>Loading your shared files</h2>
          </section>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <main className="glass-page download-page">
          <section className="glass-card download-main">
            <span className="section-kicker">Download unavailable</span>
            <h1 className="error-title">{loadError}</h1>
            <p className="error-copy">
              This code may be wrong or the shared files may have expired.
            </p>
            <Link className="ghost-link" to="/access">
              Try another code
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="glass-page download-page">
        <section className="hero-card download-topbar">
          <div className="brand-lockup download-brand">
            <h1>Filely</h1>
            <p>Privacy-first file sharing platform.</p>
          </div>
          <Link className="ghost-link download-top-action" to="/access">
            Use another code
          </Link>
        </section>

        <div className="download-grid">
          <section className="glass-card download-main">
            <div className="section-head">
              <div>
                <span className="section-kicker">Files</span>
                <h2>Pick one file or download them all</h2>
              </div>

              <button
                className="primary-action download-all"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
              >
                {downloadingAll ? "Downloading..." : "Download all files"}
              </button>
            </div>

            {actionError && (
              <div className="download-alert">{actionError}</div>
            )}

            <div className="download-list">
              {bundle.files.map((file) => (
                <article className="download-file" key={file.id}>
                  <div>
                    <strong>{file.fileName}</strong>
                    <span>{formatFileSize(file.fileSize)}</span>
                  </div>

                  <button
                    className="secondary-action"
                    onClick={() => handleSingleDownload(file.id)}
                    disabled={activeFileId === file.id || downloadingAll}
                  >
                    {activeFileId === file.id ? "Preparing..." : "Download"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <aside className="glass-card download-side">
            <div className="side-card">
              <span className="muted-label">Access code</span>
              <strong>{bundle.code}</strong>
            </div>

            <div className="side-card">
              <span className="muted-label">Files ready</span>
              <strong>{bundle.fileCount}</strong>
            </div>

            <div className="side-card">
              <span className="muted-label">Expires</span>
              <strong>{new Date(bundle.expiresAt).toLocaleString()}</strong>
            </div>

            <div className="side-card">
              <span className="muted-label">Share this page</span>
              <small>{directLink}</small>
            </div>

            <div className="side-actions">
              <button
                className="secondary-action secondary-action-wide"
                onClick={() => setIsQrOpen(true)}
                disabled={!qrCodeUrl}
              >
                Show QR
              </button>
            </div>

            <p className="download-note">
              No login is needed. If your browser asks for permission to
              download multiple files, allow it once and Filely will continue
              the rest.
            </p>
          </aside>
        </div>
      </main>

      {isQrOpen && (
        <div className="overlay">
          <div className="modal-card qr-modal">
            <div className="modal-head">
              <div>
                <span className="section-kicker">Scan to open</span>
                <h3>QR for this file page</h3>
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
              <img className="qr-image" src={qrCodeUrl} alt="QR code for the download page" />
            )}

            <p className="qr-copy">
              Scan this code from another phone or laptop to open the same file
              list instantly.
            </p>

            <button className="primary-action" onClick={() => setIsQrOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
