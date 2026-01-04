import { useState } from "react";
import { uploadFile } from "../api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    try {
      setLoading(true);
      const res = await uploadFile(file);
      setCode(res.data.code);
    } catch {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>📤 Filely</h1>
      <p>Privacy-first file sharing</p>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>

      {code && (
        <div style={styles.codeBox}>
          <p>Your access code</p>
          <h2>{code}</h2>
          <p>Share this code to download</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 400,
    margin: "100px auto",
    textAlign: "center"
  },
  codeBox: {
    marginTop: 20,
    padding: 15,
    border: "1px dashed #444"
  }
};
