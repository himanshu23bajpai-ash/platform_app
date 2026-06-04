import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCompute, useDatabases, useProject, useS3 } from "@/api/hooks";

type Tab = "compute" | "databases" | "s3";

export function ProjectInfra() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const [tab, setTab] = useState<Tab>("compute");

  if (!project) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{project.name} — AWS infra</h2>
        <Link
          to={`/projects/${project.id}`}
          style={{ marginLeft: "auto", color: "#1d4ed8", fontWeight: 600 }}
        >
          ← Back to status
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e5e7eb", marginBottom: 16 }}>
        <TabBtn active={tab === "compute"} onClick={() => setTab("compute")}>Compute</TabBtn>
        <TabBtn active={tab === "databases"} onClick={() => setTab("databases")}>Databases</TabBtn>
        <TabBtn active={tab === "s3"} onClick={() => setTab("s3")}>S3</TabBtn>
      </div>

      {tab === "compute" && <ComputeTab id={id!} />}
      {tab === "databases" && <DatabaseTab id={id!} />}
      {tab === "s3" && <S3Tab id={id!} />}
    </div>
  );
}

const TabBtn = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      background: "transparent",
      border: 0,
      borderBottom: active ? "2px solid #1d4ed8" : "2px solid transparent",
      color: active ? "#1d4ed8" : "#475569",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: 14,
    }}
  >
    {children}
  </button>
);

function ComputeTab({ id }: { id: string }) {
  const { data, isLoading } = useCompute(id);
  if (isLoading) return <p>Loading...</p>;
  if (!data?.length) return <EmptyState />;
  return (
    <ResourceTable
      cols={["Kind", "Name", "Status", "Region", "Details"]}
      rows={data.map((r) => [
        r.kind,
        r.name,
        r.status,
        r.region,
        JSON.stringify(r.details),
      ])}
    />
  );
}

function DatabaseTab({ id }: { id: string }) {
  const { data, isLoading } = useDatabases(id);
  if (isLoading) return <p>Loading...</p>;
  if (!data?.length) return <EmptyState />;
  return (
    <ResourceTable
      cols={["Kind", "Name", "Engine", "Status", "Region", "Details"]}
      rows={data.map((r) => [
        r.kind,
        r.name,
        r.engine,
        r.status,
        r.region,
        JSON.stringify(r.details),
      ])}
    />
  );
}

function S3Tab({ id }: { id: string }) {
  const { data, isLoading } = useS3(id);
  if (isLoading) return <p>Loading...</p>;
  if (!data?.length) return <EmptyState />;
  return (
    <ResourceTable
      cols={["Bucket", "Region", "Created"]}
      rows={data.map((r) => [r.name, r.region, r.created_at ?? "—"])}
    />
  );
}

const EmptyState = () => (
  <p style={{ color: "#64748b" }}>No resources found for this project.</p>
);

function ResourceTable({ cols, rows }: { cols: string[]; rows: (string | number)[][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <thead style={{ background: "#f1f5f9" }}>
        <tr>
          {cols.map((c) => (
            <th key={c} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderTop: "1px solid #e5e7eb" }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "10px 12px", fontSize: 13, fontFamily: j === row.length - 1 ? "ui-monospace, monospace" : "inherit", color: "#0f172a" }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
