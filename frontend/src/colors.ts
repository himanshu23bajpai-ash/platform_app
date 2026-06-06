/**
 * Single source of truth for every color used in the app.
 *
 * Anything color-related (MUI theme, inline styles, Highcharts options,
 * status badges, role chips, charts) imports from here. No hex codes
 * should appear anywhere else in src/.
 */

// --- Brand: purple scale built around #8a00e5 (hsl 276 100 45) ---
export const purple = {
  50: "#faf0ff",
  100: "#f0d6ff",
  200: "#e2b3ff",
  300: "#cd80ff",
  400: "#b333ff",
  500: "#8a00e5", // base brand color
  600: "#7400c2",
  700: "#5c0099",
  800: "#49007a",
  900: "#37005c",
} as const;

// --- Neutrals (slate) ---
export const neutral = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
} as const;

// --- Semantic ---
export const semantic = {
  success: { main: "#16a34a", light: "#dcfce7", dark: "#15803d" },
  warning: { main: "#f59e0b", light: "#fef3c7", dark: "#92400e" },
  error: { main: "#dc2626", light: "#fee2e2", dark: "#b91c1c" },
  info: { main: "#0ea5e9", light: "#dbeafe", dark: "#0369a1" },
} as const;

// --- Surfaces ---
export const surface = {
  appBg: purple[50],
  paper: "#ffffff",
  border: "#e5e7eb",
  divider: "#e5e7eb",
  highlight: purple[100],
} as const;

// --- Text ---
export const text = {
  primary: neutral[900],
  secondary: neutral[600],
  disabled: neutral[400],
  onPrimary: "#ffffff",
} as const;

// --- Chart series (Highcharts) ---
export const chart = {
  primary: purple[500], // brand
  secondary: purple[300],
  accent: purple[700],
  series: [purple[500], purple[300], purple[700], purple[400], purple[800], purple[200]],
  grid: surface.border,
  axisLabel: text.secondary,
  background: "transparent",
} as const;

// --- Role badges (RBAC) ---
export const roleBadge = {
  ADMIN: { bg: semantic.warning.light, fg: semantic.warning.dark },
  PROJECT_MANAGER: { bg: purple[100], fg: purple[800] },
  PROJECT_VIEWER: { bg: neutral[200], fg: neutral[700] },
} as const;

// --- Onboarding step status badges ---
export const stepBadge = {
  PENDING: { bg: neutral[200], fg: neutral[700], label: "Pending" },
  IN_PROGRESS: { bg: purple[100], fg: purple[800], label: "In progress" },
  SUCCESS: { bg: semantic.success.light, fg: semantic.success.dark, label: "Success" },
  FAILED: { bg: semantic.error.light, fg: semantic.error.dark, label: "Failed" },
} as const;

// --- Lifecycle badges ---
export const lifecycleBadge = {
  ACTIVE: { bg: semantic.success.light, fg: semantic.success.dark },
  IN_DEVELOPMENT: { bg: semantic.warning.light, fg: semantic.warning.dark },
  DEPRECATED: { bg: neutral[200], fg: neutral[700] },
} as const;
