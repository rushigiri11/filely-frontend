import axios from "axios";

const LOCAL_API_BASE = "http://localhost:5000";
const PROD_API_BASE = "https://filely-backend.onrender.com";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function resolveApiBase() {
  const envBase = import.meta.env.VITE_API_BASE;

  if (envBase) {
    return envBase;
  }

  if (LOCAL_HOSTS.has(window.location.hostname)) {
    return LOCAL_API_BASE;
  }

  return PROD_API_BASE;
}

export const API_BASE = resolveApiBase();

export const uploadFile = (formData) => {
  return axios.post(
    `${API_BASE}/api/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
};

export const fetchDownloadBundle = (code) => {
  return axios.get(`${API_BASE}/api/download/${code}`);
};

export const downloadSingleFile = (code, fileId) => {
  return axios.get(`${API_BASE}/api/download/${code}/files/${fileId}`);
};

export const downloadAllFiles = (code) => {
  return axios.get(`${API_BASE}/api/download/${code}/all`);
};

export const fetchUploadStats = () => {
  return axios.get(`${API_BASE}/api/upload/stats`);
};
