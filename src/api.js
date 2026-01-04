import axios from "axios";

const API_BASE = "https://filely-backend.onrender.com";

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API_BASE}/api/upload`, formData);
};

export const downloadByCode = (code) => {
  return axios.get(`${API_BASE}/api/download/${code}`);
};
