import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  downloadAllFiles,
  downloadSingleFile,
  fetchDownloadBundle
} from "../api";
import { chipColors, extLabel, formatClock, formatFileSize } from "../fileTypes";
import "./beam.css";
import "./Download.css";

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
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  }
}

export default function Download() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [bundle, setBundle] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({}); // id -> "busy" | "done"
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isQrOpen, setIsQrOpen] = useState(false);

  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const say = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const directLink = useMemo(
    () => `${window.location.origin}/d/${code}`,
    [code]
  );

  useEffect(() => {
    QRCode.toDataURL(directLink, {
      margin: 1,
      width: 320,
      color: { dark: "#150c33", light: "#ffffff" }
    })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(""));
  }, [directLink]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setStatus({});

    fetchDownloadBundle(code)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setBundle(res.data);
        if (res.data.expiresAt) {
          const remaining = Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000);
          setSecondsLeft(Math.max(0, remaining));
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

  // Live "deletes in" countdown.
  useEffect(() => {
    if (!bundle) {
      return undefined;
    }
    const tick = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [bundle]);

  const setFileStatus = (id, value) =>
    setStatus((current) => ({ ...current, [id]: value }));

  const handleSingleDownload = async (fileId) => {
    if (status[fileId] === "busy") {
      return;
    }
    try {
      setFileStatus(fileId, "busy");
      const res = await downloadSingleFile(code, fileId);
      await downloadFileFromSignedUrl(res.data.downloadUrl, res.data.fileName);
      setFileStatus(fileId, "done");
    } catch (err) {
      setFileStatus(fileId, undefined);
      say(err?.response?.data?.error || "Unable to download file");
    }
  };

  const handleDownloadAll = async () => {
    if (downloadingAll) {
      return;
    }
    try {
      setDownloadingAll(true);
      const res = await downloadAllFiles(code);
      const failed = [];
      for (const file of res.data.files) {
        try {
          setFileStatus(file.id ?? file.fileName, "busy");
          await downloadFileFromSignedUrl(file.downloadUrl, file.fileName);
          setFileStatus(file.id ?? file.fileName, "done");
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        } catch {
          failed.push(file.fileName);
        }
      }
      if (failed.length) {
        say(`Some files could not be downloaded: ${failed.join(", ")}`);
      }
    } catch (err) {
      say(err?.response?.data?.error || "Unable to download files");
    } finally {
      setDownloadingAll(false);
    }
  };

  const shell = (children) => (
    <div className="app-shell">
      <div className="beam-blob beam-blob-top" />
      <div className="beam-blob beam-blob-bottom" />
      <main className="beam-frame">
        <header className="beam-header">
          <button className="brand" onClick={() => navigate("/")} aria-label="Filely home">
            <span className="brand-mark" />
            <span className="brand-word">Filely</span>
          </button>
          <button className="pill-ghost" onClick={() => navigate("/")}>
            Send files
          </button>
        </header>
        {children}
      </main>
      {toast && <div className="beam-toast">{toast}</div>}
    </div>
  );

  if (loading) {
    return shell(
      <section className="beam-view beam-rise dl-status">
        <div className="dl-spinner" />
        <h1 className="beam-h1 dl-status-title">Opening your files…</h1>
        <p className="beam-sub">Checking the code and lining up your downloads.</p>
      </section>
    );
  }

  if (loadError) {
    return shell(
      <section className="beam-view beam-rise dl-status">
        <span className="dl-error-mark">!</span>
        <h1 className="beam-h1 dl-status-title">{loadError}</h1>
        <p className="beam-sub">
          This code may be wrong, or the shared files may have already expired.
        </p>
        <button className="btn-primary dl-status-btn" onClick={() => navigate("/access")}>
          Try another code
        </button>
      </section>
    );
  }

  const files = bundle.files || [];
  const totalBytes = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);

  return shell(
    <section className="beam-view beam-rise">
      <div className="dl-top">
        <span className="code-chip">{bundle.code}</span>
        <button className="btn-text" onClick={() => navigate("/access")}>
          Another code
        </button>
      </div>

      <h1 className="beam-h1 dl-title">
        {bundle.fileCount ?? files.length} {(bundle.fileCount ?? files.length) === 1 ? "file" : "files"} for you
      </h1>

      <div className="deletes-pill">
        <span className="beam-dot" />
        <span>Deletes in {formatClock(secondsLeft)}</span>
      </div>

      <div className="dl-list">
        {files.map((file) => {
          const colors = chipColors(file.fileName);
          const key = file.id ?? file.fileName;
          const state = status[key];
          return (
            <div className="dl-row" key={key}>
              <span
                className="type-chip dl-chip"
                style={{ background: colors.bg, color: colors.fg }}
              >
                {extLabel(file.fileName)}
              </span>
              <div className="dl-meta">
                <span className="dl-name">{file.fileName}</span>
                {state === "busy" ? (
                  <span className="progress">
                    <span className="progress-fill progress-indeterminate" />
                  </span>
                ) : state === "done" ? (
                  <span className="dl-saved">Saved · {formatFileSize(file.fileSize)}</span>
                ) : (
                  <span className="dl-size">{formatFileSize(file.fileSize)}</span>
                )}
              </div>
              <button
                className="icon-btn dl-get"
                aria-label={`Download ${file.fileName}`}
                onClick={() => handleSingleDownload(file.id)}
                disabled={state === "busy" || downloadingAll}
              >
                {state === "done" ? "✓" : "↓"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="dl-footer">
        <p className="dl-note">Files delete themselves when the clock runs out.</p>
        <div className="dl-footer-actions">
          <button
            className="btn-soft dl-qr-btn"
            onClick={() => setIsQrOpen(true)}
            disabled={!qrCodeUrl}
          >
            Show QR
          </button>
          <button className="btn-primary dl-all-btn" onClick={handleDownloadAll} disabled={downloadingAll}>
            {downloadingAll ? "Downloading…" : `Download all · ${formatFileSize(totalBytes)}`}
          </button>
        </div>
      </div>

      {isQrOpen && (
        <div className="overlay" onClick={() => setIsQrOpen(false)}>
          <div className="modal-card qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="beam-eyebrow">Scan to open</span>
                <h3>QR for this page</h3>
              </div>
              <button className="icon-close" onClick={() => setIsQrOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            {qrCodeUrl && <img className="qr-image" src={qrCodeUrl} alt="QR code for the download page" />}
            <p>Scan from another phone or laptop to open the same file list instantly.</p>
            <button className="btn-primary" onClick={() => setIsQrOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
