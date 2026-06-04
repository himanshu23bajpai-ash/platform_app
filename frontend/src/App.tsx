import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Projects } from "@/pages/Projects";
import { OnboardWizard } from "@/pages/OnboardWizard";
import { ProjectStatus } from "@/pages/ProjectStatus";
import { ProjectInfra } from "@/pages/ProjectInfra";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/onboard" element={<OnboardWizard />} />
        <Route path="/projects/:id" element={<ProjectStatus />} />
        <Route path="/projects/:id/infra" element={<ProjectInfra />} />
      </Route>
    </Routes>
  );
}
