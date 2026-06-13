import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useMe } from "@/api/hooks";
import { msalInstance, ssoEnabled } from "@/auth/msal";
import { api } from "@/api/client";
import type { Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Manager",
  PROJECT_VIEWER: "Viewer",
};

const ROLE_COLOR: Record<Role, "warning" | "secondary" | "default"> = {
  ADMIN: "warning",
  PROJECT_MANAGER: "secondary",
  PROJECT_VIEWER: "default",
};

export function Layout() {
  const { data: user } = useMe();
  useMsal(); // ensure MsalProvider is mounted; no per-render data needed

  const signOut = async () => {
    if (ssoEnabled) {
      await msalInstance.logoutRedirect();
      return;
    }
    await api.post("/auth/logout").catch(() => undefined);
    window.location.replace("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={{ color: "inherit", textDecoration: "none", flexShrink: 0, mr: 4 }}
          >
            Platform Manager
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
            <NavButton to="/projects" label="Projects" />
            {user?.role === "ADMIN" && <NavButton to="/onboard" label="Onboard" />}
            {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
              <NavButton to="/cost" label="Cost" />
            )}
            {user?.role === "ADMIN" && <NavButton to="/users" label="Users" />}
          </Box>
          {user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                label={ROLE_LABEL[user.role]}
                size="small"
                color={ROLE_COLOR[user.role]}
                sx={{ fontWeight: 700 }}
              />
              <Typography variant="body2">{user.name || user.email}</Typography>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,0.2)" }}>
                {(user.name || user.email || "?").charAt(0).toUpperCase()}
              </Avatar>
              <Tooltip title="Sign out">
                <IconButton onClick={signOut} sx={{ color: "inherit" }} size="small">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Typography variant="body2">Not signed in</Typography>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

function NavButton({ to, label }: { to: string; label: string }) {
  return (
    <Button
      component={NavLink}
      to={to}
      sx={{
        color: "rgba(255,255,255,0.85)",
        fontWeight: 500,
        "&.active": { color: "#fff", fontWeight: 700, bgcolor: "rgba(255,255,255,0.1)" },
      }}
    >
      {label}
    </Button>
  );
}
