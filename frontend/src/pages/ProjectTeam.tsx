import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useAddAssignment,
  useAssignments,
  useProject,
  useRemoveAssignment,
  useUsers,
} from "@/api/hooks";

export function ProjectTeam() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data: assignments } = useAssignments(id);
  const { data: users } = useUsers();
  const add = useAddAssignment(id ?? "");
  const remove = useRemoveAssignment(id ?? "");
  const [pickedUser, setPickedUser] = useState("");

  if (!project) return <p>Loading...</p>;

  const assignedUserIds = new Set(assignments?.map((a) => a.user_id));
  const candidates = (users ?? []).filter(
    (u) => u.is_active && !assignedUserIds.has(u.id) && u.role !== "ADMIN",
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{project.name} — Team</h2>
        <Link
          to={`/projects/${project.id}`}
          style={{ marginLeft: "auto", color: "#1d4ed8", fontWeight: 600 }}
        >
          ← Back to status
        </Link>
      </div>

      <p style={{ color: "#64748b" }}>
        Admins always have access. Add Project Managers or Viewers here to grant them access to this
        project.
      </p>

      <div style={card}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Assign user</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={pickedUser}
            onChange={(e) => setPickedUser(e.target.value)}
            style={{ ...input, flex: 1 }}
          >
            <option value="">Select user...</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email} ({u.role.replace("PROJECT_", "")})
              </option>
            ))}
          </select>
          <button
            disabled={!pickedUser || add.isPending}
            onClick={async () => {
              await add.mutateAsync(pickedUser);
              setPickedUser("");
            }}
            style={btnPrimary}
          >
            Assign
          </button>
        </div>
        {candidates.length === 0 && (
          <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 13 }}>
            No additional managers or viewers to assign.
          </p>
        )}
      </div>

      <table style={{ ...card, padding: 0 }}>
        <thead style={{ background: "#f1f5f9" }}>
          <tr>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Assigned</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {(assignments ?? []).map((a) => (
            <tr key={a.id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <Td>{a.user.email}</Td>
              <Td>{a.user.name || "—"}</Td>
              <Td>{a.user.role.replace("PROJECT_", "")}</Td>
              <Td>{new Date(a.created_at).toLocaleDateString()}</Td>
              <Td>
                <button
                  onClick={() => remove.mutate(a.user_id)}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "#b91c1c",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Remove
                </button>
              </Td>
            </tr>
          ))}
          {(assignments ?? []).length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 16, color: "#94a3b8", fontSize: 13 }}>
                No users assigned yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
