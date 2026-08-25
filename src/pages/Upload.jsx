import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { uploadFile, fetchUploadStats } from "../api";
import { chipColors, extLabel, formatClock, formatFileSize } from "../fileTypes";
import "./beam.css";
import "./Upload.css";

const MAX_FILES = 15;
const EXPIRY_OPTIONS = [5, 10, 30, 60];

let idSeed = 0;
const nextId = () => `${Date.now()}-${idSeed++}`;

export default function Upload() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]); // { id, file, name, size }
  const [expiry, setExpiry] = useState(10);
  const [loading, setLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [result, setResult] = useState(null); // { code, fileCount, expiresIn, totalBytes }
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isQrOpen, setIsQrOpen] = useState(false);

  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const [totalTransferred, setTotalTransferred] = useState(null);

  const say = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1800);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Global "files transferred so far" counter.
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchUploadStats();
      if (res?.data?.success) {
        setTotalTransferred(res.data.totalUploads ?? 0);
      }
    } catch {
      /* stats are non-critical; keep the app usable if this fails */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalBytes = useMemo(
    () => items.reduce((sum, it) => sum + it.size, 0),
    [items]
  );

  const directLink = useMemo(
    () => (result ? `${window.location.origin}/d/${result.code}` : ""),
    [result]
  );

  // Live countdown ring on the "sent" view.
  useEffect(() => {
    if (!result) {
      return undefined;
    }
    const tick = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [result]);

  // QR for the shared link.
  useEffect(() => {
    if (!directLink) {
      setQrCodeUrl("");
      return;
    }
    QRCode.toDataURL(directLink, {
      margin: 1,
      width: 320,
      color: { dark: "#150c33", light: "#ffffff" }
    })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(""));
  }, [directLink]);

  const addFiles = useCallback(
    (fileList) => {
      if (loading) {
        return say("Hold on — still sending");
      }
      const incoming = Array.from(fileList || []).map((file) => ({
        id: nextId(),
        file,
        name: file.name,
        size: file.size
      }));
      if (!incoming.length) {
        return;
      }
      setItems((current) => {
        const merged = current.concat(incoming);
        if (merged.length > MAX_FILES) {
          say(`Up to ${MAX_FILES} files at once`);
        }
        return merged.slice(0, MAX_FILES);
      });
      setResult(null);
    },
    [loading, say]
  );

  const removeItem = (id) => {
    setItems((current) => current.filter((it) => it.id !== id));
  };

  const onDragOver = (event) => {
    event.preventDefault();
    if (!dragging && !loading) {
      setDragging(true);
    }
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    setDragging(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer?.files);
  };

  const handleUpload = async () => {
    if (loading) {
      return;
    }
    if (!items.length) {
      return say("Choose a file first");
    }

    try {
      setLoading(true);
      setUploadPct(0);

      const formData = new FormData();
      items.forEach((it) => formData.append("files", it.file));
      formData.append("expiryMinutes", expiry);

      const res = await uploadFile(formData, (event) => {
        if (event.total) {
          setUploadPct(Math.round((event.loaded / event.total) * 100));
        }
      });

      setResult({
        code: res.data.code,
        fileCount: res.data.fileCount ?? items.length,
        expiresIn: res.data.expiresIn,
        totalBytes
      });
      setSecondsLeft(expiry * 60);

      // Reflect this batch in the running total.
      if (typeof res.data.totalUploads === "number") {
        setTotalTransferred(res.data.totalUploads);
      } else {
        setTotalTransferred((prev) =>
          typeof prev === "number"
            ? prev + (res.data.fileCount ?? items.length)
            : prev
        );
        loadStats();
      }
    } catch (error) {
      const message =
        error?.response?.data?.error || "Something went wrong. Please try again.";
      say(message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, message) => {
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    say(message);
  };

  const reset = () => {
    setResult(null);
    setItems([]);
    setSecondsLeft(0);
    setUploadPct(0);
  };

  const topActionLabel = "Got a code?";
  const ringDeg = useMemo(() => {
    const total = Math.max(1, expiry * 60);
    return `${Math.round((secondsLeft / total) * 360)}deg`;
  }, [secondsLeft, expiry]);

  return (
    <div
      className="app-shell"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="beam-blob beam-blob-top" />
      <div className="beam-blob beam-blob-bottom" />

      <main className="beam-frame">
        <header className="beam-header">
          <button className="brand" onClick={reset} aria-label="Filely home">
            <span className="brand-mark" />
            <span className="brand-word">Filely</span>
          </button>
          <button className="pill-ghost" onClick={() => navigate("/access")}>
            {topActionLabel}
          </button>
        </header>

        {!result ? (
          <section className="beam-view">
            <h1 className="beam-h1">Drop it in.</h1>
            <p className="beam-sub">
              We hand you a 6-digit code. It vanishes when the timer runs out.
            </p>

            <label className={`dropzone${dragging ? " is-dragging" : ""}`}>
              <input type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
              <span className="dropzone-plus">+</span>
              <span className="dropzone-title">
                {items.length ? "Add more files" : "Choose files"}
              </span>
              <span className="dropzone-hint">
                {items.length
                  ? `${items.length} selected · ${formatFileSize(totalBytes)}`
                  : `or drop them anywhere · ${MAX_FILES} max`}
              </span>
              {dragging && <span className="dropzone-release">Release to add</span>}
            </label>

            {items.length > 0 && (
              <div className="file-list">
                {items.map((it) => {
                  const colors = chipColors(it.name);
                  const done = loading && uploadPct >= 100;
                  return (
                    <div className="file-row" key={it.id}>
                      <span
                        className="type-chip file-chip"
                        style={{ background: colors.bg, color: colors.fg }}
                      >
                        {extLabel(it.name)}
                      </span>
                      <div className="file-meta">
                        <span className="file-name">{it.name}</span>
                        <span className="file-sub">
                          {loading
                            ? done
                              ? `${formatFileSize(it.size)} · done`
                              : `${formatFileSize(it.size)} · ${uploadPct}%`
                            : formatFileSize(it.size)}
                        </span>
                        {loading && !done && (
                          <span className="progress">
                            <span className="progress-fill" style={{ width: `${uploadPct}%` }} />
                          </span>
                        )}
                      </div>
                      {loading && done ? (
                        <span className="file-check">✓</span>
                      ) : (
                        !loading && (
                          <button
                            className="file-remove"
                            aria-label="Remove file"
                            onClick={() => removeItem(it.id)}
                          >
                            ✕
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="send-footer">
              <div className="expiry-row">
                <span className="expiry-label">Expires in</span>
                {EXPIRY_OPTIONS.map((m) => (
                  <button
                    key={m}
                    className={`expiry-chip${expiry === m ? " is-active" : ""}`}
                    onClick={() => setExpiry(m)}
                    disabled={loading}
                  >
                    {m === 60 ? "1h" : `${m}m`}
                  </button>
                ))}
              </div>
              <button className="btn-primary" onClick={handleUpload} disabled={loading}>
                {loading
                  ? "Sending…"
                  : items.length
                    ? `Send ${items.length} ${items.length === 1 ? "file" : "files"}`
                    : "Send files"}
              </button>
              {totalTransferred !== null && (
                <p className="transfer-count">
                  <span className="transfer-count-num">
                    {totalTransferred.toLocaleString()}
                  </span>{" "}
                  files transferred with Filely so far
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="beam-view beam-rise">
            <div className="sent-head">
              <span className="beam-eyebrow">
                <span className="beam-dot" />
                {result.fileCount} {result.fileCount === 1 ? "file" : "files"} sent
              </span>
              <h1 className="beam-h1 sent-title">Share your code</h1>
            </div>

            <div className="ring-wrap">
              <div className="ring" style={{ background: `conic-gradient(#34e5c4 ${ringDeg}, rgba(255,255,255,0.1) 0)` }}>
                <div className="ring-inner">
                  <span className="ring-kicker">code</span>
                  <span className="ring-code">{result.code}</span>
                  <span className="ring-clock">{formatClock(secondsLeft)} left</span>
                </div>
              </div>
            </div>

            <div className="sent-actions">
              <button className="btn-primary" onClick={() => copy(result.code, "Code copied")}>
                Copy code
              </button>
              <div className="sent-actions-row">
                <button className="btn-soft" onClick={() => copy(directLink, "Link copied")}>
                  Copy link
                </button>
                <button
                  className="btn-soft"
                  onClick={() => setIsQrOpen(true)}
                  disabled={!qrCodeUrl}
                >
                  Show QR
                </button>
              </div>
            </div>

            <div className="info-list">
              <div className="info-row">
                <span className="info-key">Link</span>
                <span className="info-val info-link">{directLink.replace(/^https?:\/\//, "")}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Size</span>
                <span className="info-val">{formatFileSize(result.totalBytes)}</span>
              </div>
            </div>

            <div className="sent-footer">
              <button
                className="btn-soft preview-btn"
                onClick={() => navigate(`/download/${result.code}`)}
              >
                Preview download page
              </button>
              <button className="btn-text reset-btn" onClick={reset}>
                Send more files
              </button>
              {totalTransferred !== null && (
                <p className="transfer-count">
                  <span className="transfer-count-num">
                    {totalTransferred.toLocaleString()}
                  </span>{" "}
                  files transferred with Filely so far
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {isQrOpen && (
        <div className="overlay" onClick={() => setIsQrOpen(false)}>
          <div className="modal-card qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="beam-eyebrow">Scan to download</span>
                <h3>QR for your link</h3>
              </div>
              <button className="icon-close" onClick={() => setIsQrOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            {qrCodeUrl && <img className="qr-image" src={qrCodeUrl} alt="QR code for the shared link" />}
            <p>Scan from another phone, tablet, or laptop to open the download page instantly.</p>
            <button className="btn-primary" onClick={() => setIsQrOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {toast && <div className="beam-toast">{toast}</div>}
    </div>
  );
}
