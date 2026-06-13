import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { MsalProvider } from "@azure/msal-react";
import { App } from "./App";
import { theme } from "./theme";
import { initializeMsal, msalInstance } from "./auth/msal";
import "./charts/setup"; // Highcharts global theme

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5000, refetchOnWindowFocus: false } },
});

async function bootstrap() {
  await initializeMsal();

  const root = (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );

  // MsalProvider is always mounted (so hooks can be called unconditionally).
  // When SSO env vars aren't set, the instance is inert.
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <MsalProvider instance={msalInstance}>{root}</MsalProvider>,
  );
}

bootstrap();
