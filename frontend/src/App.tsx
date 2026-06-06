import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useMe } from "@/api/hooks";
import { Login } from "@/pages/Login";
import { Projects } from "@/pages/Projects";
import { OnboardWizard } from "@/pages/OnboardWizard";
import { ProjectDashboard } from "@/pages/ProjectDashboard";
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
        <Route path="/projects/:id" element={<ProjectDashboard />} />
        {/* Legacy deep links → redirect into the tabbed dashboard */}
        <Route path="/projects/:id/infra" element={<RedirectToTab tab="aws" />} />
        <Route path="/projects/:id/secrets" element={<RedirectToTab tab="secrets" />} />
        <Route path="/projects/:id/team" element={<RedirectToTab tab="team" />} />
        <Route path="/projects/:id/cost" element={<RedirectToTab tab="cost" />} />
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

function RedirectToTab({ tab }: { tab: string }) {
  const { pathname } = window.location;
  const id = pathname.split("/")[2];
  return <Navigate to={`/projects/${id}?tab=${tab}`} replace />;
}
