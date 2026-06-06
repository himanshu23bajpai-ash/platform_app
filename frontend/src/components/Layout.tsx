import { Link, NavLink, Outlet } from "react-router-dom";
import { useMe } from "@/api/hooks";
import type { Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Manager",
  PROJECT_VIEWER: "Viewer",
};

const ROLE_COLOR: Record<Role, { bg: string; fg: string }> = {
  ADMIN: { bg: "#fef3c7", fg: "#92400e" },
  PROJECT_MANAGER: { bg: "#e0e7ff", fg: "#3730a3" },
  PROJECT_VIEWER: { bg: "#e2e8f0", fg: "#334155" },
};

export function Layout() {
  const { data: user } = useMe();
  const role = user?.role;

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
          {role === "ADMIN" && <NavLink to="/onboard" style={navStyle}>Onboard</NavLink>}
          {(role === "ADMIN" || role === "PROJECT_MANAGER") && (
            <NavLink to="/cost" style={navStyle}>Cost</NavLink>
          )}
          {role === "ADMIN" && <NavLink to="/users" style={navStyle}>Users</NavLink>}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}>
          {user ? (
            <>
              <span>{user.name || user.email}</span>
              {role && (
                <span
                  style={{
                    background: ROLE_COLOR[role].bg,
                    color: ROLE_COLOR[role].fg,
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                >
                  {ROLE_LABEL[role]}
                </span>
              )}
            </>
          ) : (
            "Not signed in"
          )}
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
