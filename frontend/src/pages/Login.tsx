import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import MicrosoftIcon from "@mui/icons-material/Microsoft";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { loginRequest, ssoEnabled } from "@/auth/msal";
import { purple, text } from "@/colors";

export function Login() {
  const apiBase = import.meta.env.VITE_API_BASE ?? "/api";

  if (ssoEnabled) return <SsoLogin />;
  return <ServerOauthLogin apiBase={apiBase} />;
}

function SsoLogin() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If MSAL just finished a redirect login, the active account is set —
    // bounce to /projects.
    if (isAuthenticated) {
      window.location.replace("/projects");
    }
  }, [isAuthenticated]);

  if (isAuthenticated) return <Navigate to="/projects" replace />;

  const signIn = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const busy = inProgress !== "none";

  return (
    <Wrapper>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Platform Manager
      </Typography>
      <Typography variant="body2" sx={{ color: text.secondary, mb: 3 }}>
        Sign in with your Microsoft work account to continue.
      </Typography>
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<MicrosoftIcon />}
        onClick={signIn}
        disabled={busy}
        sx={{ background: purple[500] }}
      >
        {busy ? "Signing in..." : "Sign in with Microsoft"}
      </Button>
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Wrapper>
  );
}

function ServerOauthLogin({ apiBase }: { apiBase: string }) {
  return (
    <Wrapper>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Platform Manager
      </Typography>
      <Typography variant="body2" sx={{ color: text.secondary, mb: 3 }}>
        Sign in to continue.
      </Typography>
      <Button
        component="a"
        href={`${apiBase}/auth/login`}
        variant="contained"
        size="large"
        fullWidth
        startIcon={<MicrosoftIcon />}
        sx={{ background: purple[500] }}
      >
        Sign in with Microsoft
      </Button>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4, textAlign: "center" }}>{children}</CardContent>
      </Card>
    </Box>
  );
}
