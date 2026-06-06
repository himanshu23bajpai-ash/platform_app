import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useDeleteSecret,
  useProject,
  usePutSecret,
  useReadSecret,
  useSecrets,
} from "@/api/hooks";

export function ProjectSecrets() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data: secrets, isLoading } = useSecrets(id);
  const put = usePutSecret(id ?? "");
  const del = useDeleteSecret(id ?? "");
  const read = useReadSecret();

  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  if (!project) return <p>Loading...</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !value) return;
    await put.mutateAsync({ key, value, description });
    setKey("");
    setValue("");
    setDescription("");
  };

  const reveal = async (k: string) => {
    if (revealed[k]) {
      const { [k]: _, ...rest } = revealed;
      setRevealed(rest);
      return;
    }
    const r = await read.mutateAsync({ projectId: id!, key: k });
    setRevealed((s) => ({ ...s, [k]: r.value }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{project.name} — AWS Secrets</h2>
        <Link
          to={`/projects/${project.id}`}
          style={{ marginLeft: "auto", color: "#1d4ed8", fontWeight: 600 }}
        >
          ← Back to status
        </Link>
      </div>
      <p style={{ color: "#64748b" }}>
        Secrets are stored under <code>platform/{project.name}/&lt;key&gt;</code> in AWS Secrets
        Manager (or the in-memory mock store when AWS is not configured).
      </p>

      <form onSubmit={submit} style={card}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Create or update secret</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
          <input
            placeholder="key (e.g. db_password)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={input}
            required
          />
          <input
            placeholder="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="password"
            style={input}
            required
          />
          <input
            placeholder="description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={input}
          />
          <button type="submit" disabled={put.isPending} style={btnPrimary}>
            {put.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ ...card, padding: 0 }}>
          <thead style={{ background: "#f1f5f9" }}>
            <tr>
              <Th>Key</Th>
              <Th>Value</Th>
              <Th>Description</Th>
              <Th>Last changed</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {(secrets ?? []).map((s) => (
              <tr key={s.name} style={{ borderTop: "1px solid #e5e7eb" }}>
                <Td>
                  <code>{s.name}</code>
                </Td>
                <Td>
                  {revealed[s.name] !== undefined ? (
                    <code style={{ background: "#fef9c3", padding: "2px 6px", borderRadius: 4 }}>
                      {revealed[s.name]}
                    </code>
                  ) : (
                    <code style={{ color: "#94a3b8" }}>••••••••</code>
                  )}
                  <button onClick={() => reveal(s.name)} style={tinyBtn}>
                    {revealed[s.name] !== undefined ? "hide" : "reveal"}
                  </button>
                </Td>
                <Td>{s.description || "—"}</Td>
                <Td style={{ fontSize: 12, color: "#64748b" }}>
                  {s.last_changed ? new Date(s.last_changed).toLocaleString() : "—"}
                </Td>
                <Td>
                  <button
                    onClick={() => {
                      if (confirm(`Delete secret "${s.name}"?`)) del.mutate(s.name);
                    }}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#b91c1c",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
            {(secrets ?? []).length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#94a3b8", fontSize: 13 }}>
                  No secrets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  padding: 16,
  marginBottom: 16,
  width: "100%",
  borderCollapse: "collapse",
};
const input: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 14,
  background: "white",
};
const btnPrimary: React.CSSProperties = {
  padding: "6px 16px",
  background: "#1d4ed8",
  color: "white",
  border: 0,
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
};
const tinyBtn: React.CSSProperties = {
  marginLeft: 8,
  background: "transparent",
  border: "1px solid #cbd5e1",
  padding: "2px 8px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  color: "#475569",
};
const Th = ({ children }: { children?: React.ReactNode }) => (
  <th
    style={{
      textAlign: "left",
      padding: "10px 12px",
      fontSize: 12,
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    }}
  >
    {children}
  </th>
);
const Td = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => <td style={{ padding: "10px 12px", fontSize: 14, ...style }}>{children}</td>;
