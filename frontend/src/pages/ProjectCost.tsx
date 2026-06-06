import { Link, useParams } from "react-router-dom";
import { useProject, useProjectCost } from "@/api/hooks";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function ProjectCost() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data, isLoading, error } = useProjectCost(id);

  if (isLoading || !project) return <p>Loading...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Failed to load cost data.</p>;
  if (!data) return <p>No cost data.</p>;

  const trend =
    data.total_last_month_usd > 0
      ? ((data.total_current_month_usd - data.total_last_month_usd) /
          data.total_last_month_usd) *
        100
      : 0;
  const maxMonth = Math.max(...data.last_6_months.map((m) => m.amount_usd), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{project.name} — Cost</h2>
        <Link
          to={`/projects/${project.id}`}
          style={{ marginLeft: "auto", color: "#1d4ed8", fontWeight: 600 }}
        >
          ← Back to status
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <KPI label="This month" value={fmt(data.total_current_month_usd)} />
        <KPI label="Last month" value={fmt(data.total_last_month_usd)} />
        <KPI
          label="Trend"
          value={`${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`}
          color={trend >= 0 ? "#b91c1c" : "#15803d"}
        />
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>By service (this month)</h3>
        {data.breakdown.map((b) => {
          const pct = (b.amount_usd / data.total_current_month_usd) * 100 || 0;
          return (
            <div key={b.service} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{b.service}</span>
                <span style={{ color: "#64748b" }}>
                  {fmt(b.amount_usd)} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div
                style={{
                  background: "#e2e8f0",
                  borderRadius: 4,
                  height: 8,
                  marginTop: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    background: "#1d4ed8",
                    height: "100%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Last 6 months</h3>
        <div style={{ display: "flex", alignItems: "stretch", gap: 12, height: 160 }}>
          {data.last_6_months.map((m) => {
            const h = (m.amount_usd / maxMonth) * 100;
            return (
              <div
                key={m.month}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ fontSize: 11, color: "#475569", textAlign: "center", marginBottom: 4 }}>
                  {fmt(m.amount_usd)}
                </div>
                <div
                  style={{
                    height: `${h}%`,
                    background: "#3b82f6",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                  }}
                  title={fmt(m.amount_usd)}
                />
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4, textAlign: "center" }}>
                  {m.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const KPI = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div
    style={{
      background: "white",
      padding: 16,
      borderRadius: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    }}
  >
    <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: color ?? "#0f172a" }}>
      {value}
    </div>
  </div>
);

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  padding: 16,
  marginBottom: 16,
};
