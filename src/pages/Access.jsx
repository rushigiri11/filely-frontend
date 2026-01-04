import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Access() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>🔑 Enter Code</h1>

      <input
        placeholder="Enter file code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />

      <button onClick={() => navigate(`/download/${code}`)}>
        Download
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 400,
    margin: "100px auto",
    textAlign: "center"
  }
};
