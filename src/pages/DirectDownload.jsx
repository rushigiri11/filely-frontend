import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { downloadByCode } from "../api";

export default function DirectDownload() {
  const { code } = useParams();

  useEffect(() => {
    const openFile = async () => {
      try {
        const res = await downloadByCode(code);
        window.location.href = res.data.downloadUrl;
      } catch {
        alert("Invalid or expired link");
      }
    };

    openFile();
  }, [code]);

  return (
    <h2 style={{ textAlign: "center", marginTop: 100 }}>
      Preparing your file…
    </h2>
  );
}
