import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./beam.css";
import "./Access.css";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "paste", "0", "back"];

export default function Access() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const say = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1800);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const ready = digits.length === 6;

  const openFiles = useCallback(() => {
    if (digits.length !== 6) {
      return say("Six digits needed");
    }
    navigate(`/download/${digits}`);
  }, [digits, navigate, say]);

  const press = useCallback(
    (key) => {
      if (key === "back") {
        return setDigits((current) => current.slice(0, -1));
      }
      if (key === "paste") {
        if (navigator.clipboard?.readText) {
          navigator.clipboard
            .readText()
            .then((text) => {
              const cleaned = String(text).replace(/\D/g, "").slice(0, 6);
              if (cleaned) {
                setDigits(cleaned);
              } else {
                say("Nothing to paste");
              }
            })
            .catch(() => say("Nothing to paste"));
        } else {
          say("Nothing to paste");
        }
        return;
      }
      setDigits((current) => (current + key).slice(0, 6));
    },
    [say]
  );

  // Physical keyboard support.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key >= "0" && event.key <= "9") {
        setDigits((current) => (current + event.key).slice(0, 6));
      } else if (event.key === "Backspace") {
        setDigits((current) => current.slice(0, -1));
      } else if (event.key === "Enter") {
        openFiles();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openFiles]);

  const cells = [0, 1, 2, 3, 4, 5];

  return (
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

        <section className="beam-view beam-rise">
          <h1 className="beam-h1">Type the code</h1>
          <p className="beam-sub">
            Six digits from whoever sent the files. No sign-in, ever.
          </p>

          <div className="digit-row">
            {cells.map((i) => {
              const char = digits[i] || "";
              const filled = Boolean(digits[i]);
              const active = digits.length === i;
              const state = filled ? "filled" : active ? "active" : "empty";
              return (
                <span className="digit-cell" key={i}>
                  <span className={`digit-box digit-${state}`}>
                    {filled && char}
                    {active && <span className="digit-caret" />}
                  </span>
                </span>
              );
            })}
          </div>

          <button
            className={`btn-primary open-btn${ready ? "" : " is-idle"}`}
            onClick={openFiles}
          >
            {ready ? "Open files" : "Enter 6 digits"}
          </button>

          <div className="keypad">
            {KEYS.map((key) => {
              const soft = key === "paste" || key === "back";
              const label = key === "back" ? "⌫" : key === "paste" ? "Paste" : key;
              return (
                <span className="keypad-cell" key={key}>
                  <button
                    className={soft ? "key key-soft" : "key key-digit"}
                    onClick={() => press(key)}
                  >
                    {label}
                  </button>
                </span>
              );
            })}
          </div>
        </section>
      </main>

      {toast && <div className="beam-toast">{toast}</div>}
    </div>
  );
}
