import { Link, useParams } from "react-router-dom";
import { useMe, useOnboarding, useProject, useRetryStep } from "@/api/hooks";
import { StatusBadge } from "@/components/StatusBadge";
import type { StepName } from "@/types";

const STEP_LABELS: Record<StepName, string> = {
  REPO_REGISTRATION: "Register repository",
  AWS_ACCOUNT_VPC: "Provision AWS account / VPC",
  CICD_PIPELINE: "Set up CI/CD pipeline",
  COMPUTE_PROVISION: "Provision compute",
};

export function ProjectStatus() {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const { data: project } = useProject(id);
  const { data: steps, isLoading } = useOnboarding(id);
  const retry = useRetryStep(id ?? "");
  const canSeeCost = me?.role === "ADMIN" || me?.role === "PROJECT_MANAGER";

  if (isLoading) return <p>Loading...</p>;
  if (!project || !steps) return <p>Project not found.</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 16 }}>
        <h2 style={{ margin: 0 }}>{project.name}</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          <Link to={`/projects/${project.id}/secrets`} style={{ color: "#1d4ed8", fontWeight: 600 }}>
            Secrets →
          </Link>
          {canSeeCost && (
            <Link to={`/projects/${project.id}/cost`} style={{ color: "#1d4ed8", fontWeight: 600 }}>
              Cost →
            </Link>
          )}
          <Link to={`/projects/${project.id}/infra`} style={{ color: "#1d4ed8", fontWeight: 600 }}>
            AWS infra →
          </Link>
        </div>
      </div>

      <p style={{ color: "#475569" }}>{project.description || "(no description)"}</p>

      <h3 style={{ marginTop: 24 }}>Onboarding steps</h3>
      <ol style={{ listStyle: "none", padding: 0 }}>
        {steps.map((s) => (
          <li
            key={s.id}
            style={{
              background: "white",
              padding: 16,
              borderRadius: 8,
              marginBottom: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: "#1d4ed8",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                marginRight: 12,
              }}
            >
              {s.order_index + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{STEP_LABELS[s.step]}</div>
              <div style={{ color: "#475569", fontSize: 13, marginTop: 2 }}>
                {s.message || "—"}
              </div>
              {s.completed_at && (
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                  Completed {new Date(s.completed_at).toLocaleString()}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusBadge status={s.status} />
              {s.status === "FAILED" && (
                <button
                  onClick={() => retry.mutate(s.step)}
                  disabled={retry.isPending}
                  style={{
                    padding: "4px 10px",
                    background: "#1d4ed8",
                    color: "white",
                    border: 0,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
