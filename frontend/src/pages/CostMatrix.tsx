import { Link } from "react-router-dom";
import { useCostMatrix, useMe } from "@/api/hooks";
import { neutral, semantic, surface, text } from "@/colors";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function CostMatrix() {
  const { data: me } = useMe();
  const { data, isLoading, error } = useCostMatrix();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p style={{ color: semantic.error.dark }}>Failed to load cost matrix.</p>;
  if (!data || data.length === 0) return <p>No cost data available.</p>;

  const total = data.reduce((s, r) => s + r.current_month_usd, 0);
  const lastTotal = data.reduce((s, r) => s + r.last_month_usd, 0);
  const orgTrend = lastTotal > 0 ? ((total - lastTotal) / lastTotal) * 100 : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Cost matrix</h2>
        <span style={{ marginLeft: 12, fontSize: 12, color: text.secondary }}>
          {me?.role === "ADMIN" ? "All projects" : "Your assigned projects"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <KPI label="This month" value={fmt(total)} />
        <KPI label="Last month" value={fmt(lastTotal)} />
        <KPI
          label="Trend"
          value={`${orgTrend >= 0 ? "+" : ""}${orgTrend.toFixed(1)}%`}
          color={orgTrend >= 0 ? semantic.error.dark : semantic.success.dark}
        />
      </div>

      <table style={tableStyle}>
        <thead style={{ background: neutral[100] }}>
          <tr>
            <Th>Project</Th>
            <Th>This month</Th>
            <Th>Last month</Th>
            <Th>Trend</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.project_id} style={{ borderTop: `1px solid ${surface.border}` }}>
              <Td>
                <strong>{row.project_name}</strong>
              </Td>
              <Td>{fmt(row.current_month_usd)}</Td>
              <Td style={{ color: text.secondary }}>{fmt(row.last_month_usd)}</Td>
              <Td
                style={{
                  color: row.trend_pct >= 0 ? semantic.error.dark : semantic.success.dark,
                  fontWeight: 600,
                }}
              >
                {row.trend_pct >= 0 ? "+" : ""}
                {row.trend_pct.toFixed(1)}%
              </Td>
              <Td>
                <Link to={`/projects/${row.project_id}/cost`} style={{ fontSize: 13 }}>
                  Details →
                </Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const KPI = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div
    style={{
      background: surface.paper,
      padding: 16,
      borderRadius: 8,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    }}
  >
    <div style={{ fontSize: 12, color: text.secondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: color ?? text.primary }}>
      {value}
    </div>
  </div>
);

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: surface.paper,
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
const Th = ({ children }: { children?: React.ReactNode }) => (
  <th
    style={{
      textAlign: "left",
      padding: "10px 12px",
      fontSize: 12,
      color: text.secondary,
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
