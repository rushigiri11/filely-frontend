import axios from "axios";

const API_BASE = "https://filely-backend.onrender.com";

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

export const downloadByCode = (code) => {
  return axios.get(`${API_BASE}/api/download/${code}`);
};
