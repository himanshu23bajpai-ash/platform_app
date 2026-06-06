import { useState } from "react";
import {
  useCreateUser,
  useDeleteUser,
  useMe,
  useUpdateUser,
  useUsers,
} from "@/api/hooks";
import type { Role } from "@/types";

const ROLES: Role[] = ["ADMIN", "PROJECT_MANAGER", "PROJECT_VIEWER"];
const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  PROJECT_VIEWER: "Project Viewer",
};

export function Users() {
  const { data: me } = useMe();
  const { data: users, isLoading } = useUsers();
  const create = useCreateUser();
  const update = useUpdateUser();
  const remove = useDeleteUser();

  const [form, setForm] = useState<{ email: string; name: string; role: Role }>({
    email: "",
    name: "",
    role: "PROJECT_VIEWER",
  });

  if (isLoading) return <p>Loading...</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    await create.mutateAsync(form);
    setForm({ email: "", name: "", role: "PROJECT_VIEWER" });
  };

  return (
    <div>
      <h2>Users</h2>

      <form onSubmit={submit} style={cardStyle}>
        <h3 style={{ marginTop: 0, fontSize: 15 }}>Add user</h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 8 }}>
          <input
            placeholder="email@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
            required
            type="email"
          />
          <input
            placeholder="Display name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            style={inputStyle}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={create.isPending} style={btnPrimary}>
            {create.isPending ? "Adding..." : "Add"}
          </button>
        </div>
        {create.error && (
          <p style={{ color: "#b91c1c", marginTop: 8, fontSize: 13 }}>
            {(create.error as Error).message}
          </p>
        )}
      </form>

      <table style={{ ...cardStyle, padding: 0 }}>
        <thead style={{ background: "#f1f5f9" }}>
          <tr>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Active</Th>
            <Th>Created</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {(users ?? []).map((u) => {
            const isSelf = me?.id === u.id;
            return (
              <tr key={u.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <Td>{u.email}</Td>
                <Td>{u.name || "—"}</Td>
                <Td>
                  <select
                    value={u.role}
                    disabled={isSelf}
                    onChange={(e) =>
                      update.mutate({ id: u.id, role: e.target.value as Role })
                    }
                    style={{ ...inputStyle, padding: "4px 8px", fontSize: 13 }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="checkbox"
                    checked={u.is_active}
                    disabled={isSelf}
                    onChange={(e) =>
                      update.mutate({ id: u.id, is_active: e.target.checked })
                    }
                  />
                </Td>
                <Td>{new Date(u.created_at).toLocaleDateString()}</Td>
                <Td>
                  {!isSelf && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${u.email}?`)) remove.mutate(u.id);
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
                  )}
                  {isSelf && (
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>(you)</span>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  padding: 16,
  marginBottom: 16,
  width: "100%",
  borderCollapse: "collapse",
};

const inputStyle: React.CSSProperties = {
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
