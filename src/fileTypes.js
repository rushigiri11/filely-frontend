// File-type chip palette + shared formatting helpers for the Beam UI.

const TYPES = {
  pdf: ["rgba(255,110,120,0.18)", "#FF9AA5"],
  jpg: ["rgba(120,180,255,0.18)", "#9CC6FF"],
  jpeg: ["rgba(120,180,255,0.18)", "#9CC6FF"],
  png: ["rgba(120,180,255,0.18)", "#9CC6FF"],
  gif: ["rgba(120,180,255,0.18)", "#9CC6FF"],
  webp: ["rgba(120,180,255,0.18)", "#9CC6FF"],
  heic: ["rgba(120,180,255,0.18)", "#9CC6FF"],
  mp4: ["rgba(255,190,110,0.18)", "#FFCE8F"],
  mov: ["rgba(255,190,110,0.18)", "#FFCE8F"],
  avi: ["rgba(255,190,110,0.18)", "#FFCE8F"],
  mkv: ["rgba(255,190,110,0.18)", "#FFCE8F"],
  zip: ["rgba(255,255,255,0.08)", "#A79FC8"],
  rar: ["rgba(255,255,255,0.08)", "#A79FC8"],
  "7z": ["rgba(255,255,255,0.08)", "#A79FC8"],
  doc: ["rgba(140,170,255,0.18)", "#AFC2FF"],
  docx: ["rgba(140,170,255,0.18)", "#AFC2FF"],
  txt: ["rgba(140,170,255,0.18)", "#AFC2FF"],
  ppt: ["rgba(255,150,110,0.18)", "#FFB08F"],
  pptx: ["rgba(255,150,110,0.18)", "#FFB08F"],
  xls: ["rgba(120,220,160,0.18)", "#8FE7B4"],
  xlsx: ["rgba(120,220,160,0.18)", "#8FE7B4"],
  csv: ["rgba(120,220,160,0.18)", "#8FE7B4"],
  mp3: ["rgba(52,229,196,0.18)", "#34E5C4"],
  wav: ["rgba(52,229,196,0.18)", "#34E5C4"]
};

const FALLBACK = ["rgba(255,255,255,0.08)", "#A79FC8"];

export function getExt(name) {
  const parts = String(name || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "file";
}

export function chipColors(name) {
  const ext = getExt(name);
  const pair = TYPES[ext] || FALLBACK;
  return { bg: pair[0], fg: pair[1] };
}

export function extLabel(name) {
  return getExt(name).slice(0, 4).toUpperCase();
}

export function formatFileSize(bytes) {
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

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
