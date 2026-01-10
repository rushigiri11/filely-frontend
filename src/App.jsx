import { BrowserRouter, Routes, Route } from "react-router-dom";
import Upload from "./pages/Upload";
import Access from "./pages/Access";
import Download from "./pages/Download";
import DirectDownload from "./pages/DirectDownload";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/access" element={<Access />} />
        <Route path="/download/:code" element={<Download />} />
        <Route path="/d/:code" element={<Download />} />
        <Route path="/d/:code" element={<DirectDownload />} />

      </Routes>
    </BrowserRouter>
  );
}
