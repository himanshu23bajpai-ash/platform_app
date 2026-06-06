import { stepBadge } from "@/colors";
import type { StepStatus } from "@/types";

export function StatusBadge({ status }: { status: StepStatus }) {
  const c = stepBadge[status];
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
