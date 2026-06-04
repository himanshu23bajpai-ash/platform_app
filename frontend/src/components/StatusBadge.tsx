import type { StepStatus } from "@/types";

const COLORS: Record<StepStatus, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: "#e5e7eb", fg: "#374151", label: "Pending" },
  IN_PROGRESS: { bg: "#dbeafe", fg: "#1d4ed8", label: "In progress" },
  SUCCESS: { bg: "#dcfce7", fg: "#15803d", label: "Success" },
  FAILED: { bg: "#fee2e2", fg: "#b91c1c", label: "Failed" },
};

export function StatusBadge({ status }: { status: StepStatus }) {
  const c = COLORS[status];
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}
