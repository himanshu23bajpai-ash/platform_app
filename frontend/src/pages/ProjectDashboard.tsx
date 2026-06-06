import { useMemo } from "react";
import {
  AppBar,
  Box,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMe, useProject } from "@/api/hooks";
import { AwsTab } from "@/components/tabs/AwsTab";
import { AiTab } from "@/components/tabs/AiTab";
import { ActivityTab } from "@/components/tabs/ActivityTab";
import { OnboardingTab } from "@/components/tabs/OnboardingTab";
import { SecretsTab } from "@/components/tabs/SecretsTab";
import { TeamTab } from "@/components/tabs/TeamTab";
import { CostTab } from "@/components/tabs/CostTab";

type TabKey =
  | "aws"
  | "ai"
  | "activity"
  | "onboarding"
  | "secrets"
  | "team"
  | "cost";

export function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: me } = useMe();
  const { data: project } = useProject(id);

  const tabs = useMemo(() => {
    const t: { key: TabKey; label: string }[] = [
      { key: "aws", label: "AWS" },
      { key: "ai", label: "AI" },
      { key: "activity", label: "Application Activity" },
      { key: "onboarding", label: "Onboarding" },
      { key: "secrets", label: "Secrets" },
    ];
    if (me?.role === "ADMIN" || me?.role === "PROJECT_MANAGER") {
      t.push({ key: "cost", label: "Cost" });
    }
    if (me?.role === "ADMIN") t.push({ key: "team", label: "Team" });
    return t;
  }, [me]);

  const activeTab = (searchParams.get("tab") as TabKey) ?? "aws";
  const setTab = (key: TabKey) => {
    searchParams.set("tab", key);
    setSearchParams(searchParams, { replace: true });
  };

  if (!project || !id) return null;

  return (
    <Box sx={{ mx: -3, mt: -3 }}>
      {/* Project header */}
      <Box sx={{ bgcolor: "primary.main", color: "white", px: 3, py: 2 }}>
        <Toolbar disableGutters sx={{ minHeight: "auto !important" }}>
          <IconButton onClick={() => navigate("/projects")} sx={{ color: "white", mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {project.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {project.description || "—"}
            </Typography>
          </Box>
        </Toolbar>
      </Box>

      {/* Tab bar */}
      <AppBar position="static" color="secondary" elevation={0}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            px: 2,
            "& .MuiTab-root": {
              color: "rgba(255,255,255,0.75)",
              textTransform: "uppercase",
              fontWeight: 600,
              fontSize: 13,
            },
            "& .Mui-selected": { color: "#fff" },
            "& .MuiTabs-indicator": { backgroundColor: "#fff", height: 3 },
          }}
        >
          {tabs.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </AppBar>

      {/* Tab content */}
      <Box sx={{ px: 3, py: 3 }}>
        {activeTab === "aws" && <AwsTab projectId={id} />}
        {activeTab === "ai" && <AiTab projectId={id} />}
        {activeTab === "activity" && <ActivityTab projectId={id} />}
        {activeTab === "onboarding" && <OnboardingTab projectId={id} />}
        {activeTab === "secrets" && <SecretsTab projectId={id} />}
        {activeTab === "team" && me?.role === "ADMIN" && <TeamTab projectId={id} />}
        {activeTab === "cost" &&
          (me?.role === "ADMIN" || me?.role === "PROJECT_MANAGER") && (
            <CostTab projectId={id} />
          )}
      </Box>
    </Box>
  );
}
