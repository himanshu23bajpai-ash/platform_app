import { Link, NavLink, Outlet } from "react-router-dom";
import { useMe } from "@/api/hooks";

export function Layout() {
  const { data: user } = useMe();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 24px",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "#0f172a", textDecoration: "none" }}>
          Platform App
        </Link>
        <nav style={{ marginLeft: 24, display: "flex", gap: 16 }}>
          <NavLink to="/projects" style={navStyle}>Projects</NavLink>
          <NavLink to="/onboard" style={navStyle}>Onboard</NavLink>
        </nav>
        <div style={{ marginLeft: "auto", fontSize: 14, color: "#475569" }}>
          {user ? `${user.name || user.email}` : "Not signed in"}
        </div>
      </header>
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

const navStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? "#1d4ed8" : "#334155",
  fontWeight: isActive ? 700 : 500,
  textDecoration: "none",
  fontSize: 14,
});
