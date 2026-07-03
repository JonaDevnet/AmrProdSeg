import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <Navbar />
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(14px, 4vw, 28px) 28px" }}>
        <Outlet />
      </main>
    </div>
  );
}
