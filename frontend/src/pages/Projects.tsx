import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useDeleteProject,
  useMe,
  useProjects,
  useRestoreProject,
} from "@/api/hooks";
import { StatusBadge } from "@/components/StatusBadge";

export function Projects() {
  const { data: me } = useMe();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { data, isLoading, error } = useProjects(includeDeleted);
  const del = useDeleteProject();
  const restore = useRestoreProject();
  const isAdmin = me?.role === "ADMIN";

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Failed to load projects.</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <h2 style={{ margin: 0 }}>Projects</h2>
        {isAdmin && (
          <label style={{ marginLeft: 16, fontSize: 13, color: "#475569" }}>
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              style={{ marginRight: 4 }}
            />
            Show deleted
          </label>
        )}
        {isAdmin && (
          <Link
            to="/onboard"
            style={{
              marginLeft: "auto",
              padding: "8px 12px",
              background: "#1d4ed8",
              color: "white",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            + Onboard project
          </Link>
        )}
      </div>

      {!data || data.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No projects {isAdmin ? "yet." : "assigned to you."}{" "}
          {isAdmin && <Link to="/onboard">Onboard one</Link>}
        </p>
      ) : (
        <table style={tableStyle}>
          <thead style={{ background: "#f1f5f9" }}>
            <tr>
              <Th>Name</Th>
              <Th>Compute</Th>
              <Th>Region</Th>
              <Th>Progress</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {data.map((p) => {
              const deleted = !!p.deleted_at;
              return (
                <tr
                  key={p.id}
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    opacity: deleted ? 0.55 : 1,
                  }}
                >
                  <Td>
                    <strong>{p.name}</strong>
                    {deleted && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "#b91c1c", fontWeight: 700 }}>
                        DELETED
                      </span>
                    )}
                  </Td>
                  <Td>{p.compute_type.toUpperCase()}</Td>
                  <Td>{p.aws_region}</Td>
                  <Td>
                    {p.steps_completed} / {p.steps_total}
                  </Td>
                  <Td>
                    <StatusBadge status={p.overall_status} />
                  </Td>
                  <Td>
                    {!deleted ? (
                      <>
                        <Link to={`/projects/${p.id}`} style={linkStyle}>Status</Link>
                        <Link to={`/projects/${p.id}/infra`} style={linkStyle}>Infra</Link>
                        <Link to={`/projects/${p.id}/secrets`} style={linkStyle}>Secrets</Link>
                        {isAdmin && (
                          <>
                            <Link to={`/projects/${p.id}/team`} style={linkStyle}>Team</Link>
                            <button
                              onClick={() => {
                                if (confirm(`Soft-delete "${p.name}"?`)) del.mutate(p.id);
                              }}
                              style={{ ...rowBtn, color: "#b91c1c" }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      isAdmin && (
                        <button
                          onClick={() => restore.mutate(p.id)}
                          style={{ ...rowBtn, color: "#15803d" }}
                        >
                          Restore
                        </button>
                      )
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const linkStyle: React.CSSProperties = {
  marginRight: 12,
  fontSize: 13,
};

const rowBtn: React.CSSProperties = {
  background: "transparent",
  border: 0,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  padding: 0,
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
const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={{ padding: "10px 12px", fontSize: 14 }}>{children}</td>
);
