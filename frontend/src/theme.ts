import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5b21b6", light: "#7c3aed", dark: "#4c1d95" },
    secondary: { main: "#a78bfa", light: "#c4b5fd", dark: "#7c3aed" },
    background: { default: "#faf5ff", paper: "#ffffff" },
    success: { main: "#16a34a" },
    warning: { main: "#f59e0b" },
    error: { main: "#dc2626" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: "1px solid #e5e7eb" } },
    },
    MuiAppBar: { defaultProps: { elevation: 0 } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
