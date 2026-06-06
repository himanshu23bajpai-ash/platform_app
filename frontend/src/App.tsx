import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useMe } from "@/api/hooks";
import { Login } from "@/pages/Login";
import { Projects } from "@/pages/Projects";
import { OnboardWizard } from "@/pages/OnboardWizard";
import { ProjectStatus } from "@/pages/ProjectStatus";
import { ProjectInfra } from "@/pages/ProjectInfra";
import { ProjectSecrets } from "@/pages/ProjectSecrets";
import { ProjectTeam } from "@/pages/ProjectTeam";
import { ProjectCost } from "@/pages/ProjectCost";
import { Users } from "@/pages/Users";
import { CostMatrix } from "@/pages/CostMatrix";
import type { Role } from "@/types";

function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <p style={{ padding: 24 }}>Loading...</p>;
  if (!me) return <Navigate to="/login" replace />;
  if (!roles.includes(me.role))
    return (
      <p style={{ padding: 24, color: "#b91c1c" }}>
        You don't have permission to view this page.
      </p>
    );
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<Projects />} />
        <Route
          path="/onboard"
          element={
            <RequireRole roles={["ADMIN"]}>
              <OnboardWizard />
            </RequireRole>
          }
        />
        <Route path="/projects/:id" element={<ProjectStatus />} />
        <Route path="/projects/:id/infra" element={<ProjectInfra />} />
        <Route path="/projects/:id/secrets" element={<ProjectSecrets />} />
        <Route
          path="/projects/:id/team"
          element={
            <RequireRole roles={["ADMIN"]}>
              <ProjectTeam />
            </RequireRole>
          }
        />
        <Route
          path="/projects/:id/cost"
          element={
            <RequireRole roles={["ADMIN", "PROJECT_MANAGER"]}>
              <ProjectCost />
            </RequireRole>
          }
        />
        <Route
          path="/cost"
          element={
            <RequireRole roles={["ADMIN", "PROJECT_MANAGER"]}>
              <CostMatrix />
            </RequireRole>
          }
        />
        <Route
          path="/users"
          element={
            <RequireRole roles={["ADMIN"]}>
              <Users />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}
