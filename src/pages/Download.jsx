import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { downloadByCode } from "../api";

export default function Download() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    downloadByCode(code)
      .then((res) => setData(res.data))
      .catch(() => setError("Invalid or expired code"));
  }, [code]);

  if (error) return <h2 style={{ textAlign: "center" }}>{error}</h2>;
  if (!data) return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  return (
    <div style={styles.container}>
      <h1>📥 Download</h1>
      <p>{data.fileName}</p>
      <a href={data.downloadUrl}>
        <button>Download File</button>
      </a>
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
