import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ReplayIcon from "@mui/icons-material/Replay";
import { useMe, useOnboarding, useRetryStep } from "@/api/hooks";
import type { StepName, StepStatus } from "@/types";

const STEP_LABELS: Record<StepName, string> = {
  REPO_REGISTRATION: "Register repository",
  AWS_ACCOUNT_VPC: "Provision AWS account / VPC",
  CICD_PIPELINE: "Set up CI/CD pipeline",
  COMPUTE_PROVISION: "Provision compute",
};

const STATUS_COLOR: Record<
  StepStatus,
  "success" | "info" | "warning" | "error" | "default"
> = {
  SUCCESS: "success",
  IN_PROGRESS: "info",
  PENDING: "default",
  FAILED: "error",
};

const statusIcon = (s: StepStatus) => {
  if (s === "SUCCESS") return <CheckCircleIcon fontSize="small" />;
  if (s === "FAILED") return <ErrorOutlineIcon fontSize="small" />;
  return <HourglassEmptyIcon fontSize="small" />;
};

export function OnboardingTab({ projectId }: { projectId: string }) {
  const { data: me } = useMe();
  const { data: steps, isLoading } = useOnboarding(projectId);
  const retry = useRetryStep(projectId);

  if (isLoading || !steps) return <LinearProgress />;

  const completed = steps.filter((s) => s.status === "SUCCESS").length;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Onboarding
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(completed / steps.length) * 100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="body2">
              {completed} / {steps.length} steps
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        {steps.map((s) => (
          <Card key={s.id}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32, fontSize: 14 }}>
                  {s.order_index + 1}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {STEP_LABELS[s.step]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.message || "—"}
                  </Typography>
                  {s.completed_at && (
                    <Typography variant="caption" color="text.disabled">
                      Completed {new Date(s.completed_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <Chip
                  size="small"
                  icon={statusIcon(s.status)}
                  label={s.status.replace("_", " ").toLowerCase()}
                  color={STATUS_COLOR[s.status]}
                />
                {s.status === "FAILED" && me?.role === "ADMIN" && (
                  <Button
                    startIcon={<ReplayIcon />}
                    size="small"
                    variant="outlined"
                    onClick={() => retry.mutate(s.step)}
                  >
                    Retry
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
