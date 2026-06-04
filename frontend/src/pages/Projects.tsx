import { Link } from "react-router-dom";
import { useProjects } from "@/api/hooks";
import { StatusBadge } from "@/components/StatusBadge";

export function Projects() {
  const { data, isLoading, error } = useProjects();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Failed to load projects.</p>;
  if (!data || data.length === 0)
    return (
      <div>
        <h2>Projects</h2>
        <p>No projects yet. <Link to="/onboard">Onboard one</Link>.</p>
      </div>
    );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Projects</h2>
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
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <thead style={{ background: "#f1f5f9" }}>
          <tr>
            <Th>Name</Th>
            <Th>Compute</Th>
            <Th>Region</Th>
            <Th>Progress</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <Td><strong>{p.name}</strong></Td>
              <Td>{p.compute_type.toUpperCase()}</Td>
              <Td>{p.aws_region}</Td>
              <Td>{p.steps_completed} / {p.steps_total}</Td>
              <Td><StatusBadge status={p.overall_status} /></Td>
              <Td>
                <Link to={`/projects/${p.id}`} style={{ marginRight: 12 }}>Status</Link>
                <Link to={`/projects/${p.id}/infra`}>Infra</Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children }: { children?: React.ReactNode }) => (
  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={{ padding: "10px 12px", fontSize: 14 }}>{children}</td>
);
