import { createTheme } from "@mui/material/styles";
import { purple, semantic, surface, text } from "./colors";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: purple[500], // #8a00e5 brand color
      light: purple[300],
      dark: purple[700],
      contrastText: text.onPrimary,
    },
    secondary: {
      main: purple[300],
      light: purple[200],
      dark: purple[500],
      contrastText: text.onPrimary,
    },
    background: { default: surface.appBg, paper: surface.paper },
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
    text: {
      primary: text.primary,
      secondary: text.secondary,
      disabled: text.disabled,
    },
    divider: surface.divider,
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
      styleOverrides: { root: { border: `1px solid ${surface.border}` } },
    },
    MuiAppBar: { defaultProps: { elevation: 0 } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
