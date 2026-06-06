export function Login() {
  const apiBase = import.meta.env.VITE_API_BASE ?? "/api";
  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: 22 }}>Platform App</h1>
      <p style={{ color: "#475569" }}>Sign in to continue.</p>
      <a
        href={`${apiBase}/auth/login`}
        style={{
          display: "inline-block",
          marginTop: 16,
          padding: "10px 16px",
          background: "#5b21b6",
          color: "white",
          borderRadius: 6,
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Sign in with Microsoft
      </a>
    </div>
  );
}
