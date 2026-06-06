import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useProjectAi } from "@/api/hooks";
import { KpiCard } from "@/components/KpiCard";

const JOB_COLOR: Record<string, "success" | "info" | "default" | "error"> = {
  completed: "success",
  running: "info",
  queued: "default",
  failed: "error",
};

export function AiTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectAi(projectId);

  if (isLoading || !data) return <LinearProgress />;
  const m = data.metrics;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        AI Models &amp; ML Operations
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KpiCard label="Active Models" value={m.active_models} icon={<PsychologyAltIcon />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Predictions Today"
            value={m.predictions_today.toLocaleString()}
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Avg Latency" value={`${m.avg_latency_ms}ms`} icon={<AccessTimeIcon />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Error Rate"
            value={`${m.error_rate_pct.toFixed(2)}%`}
            icon={<CheckCircleOutlineIcon />}
            color={m.error_rate_pct < 1 ? "success.main" : m.error_rate_pct < 3 ? "warning.main" : "error.main"}
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Deployed Models
          </Typography>
          <Stack spacing={1.5}>
            {data.models.map((model) => (
              <Box
                key={model.id}
                sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.5 }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {model.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {model.version} • Last trained: {model.last_trained}
                    </Typography>
                  </Box>
                  <Chip
                    label={model.status}
                    size="small"
                    color={model.status === "deployed" ? "success" : model.status === "training" ? "info" : "default"}
                  />
                </Stack>
                <Box sx={{ mt: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption">Model Accuracy</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {model.accuracy_pct}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={model.accuracy_pct}
                    sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Training Jobs
          </Typography>
          <Stack spacing={1.5}>
            {data.jobs.map((job) => (
              <Box
                key={job.id}
                sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1.5 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {job.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • {job.name}
                  </Typography>
                  <Box sx={{ ml: "auto" }}>
                    <Chip
                      label={job.status}
                      size="small"
                      color={JOB_COLOR[job.status] ?? "default"}
                    />
                  </Box>
                </Stack>
                {job.status === "completed" && job.duration && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Duration: {job.duration}
                  </Typography>
                )}
                {job.status === "running" && job.progress_pct != null && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={job.progress_pct}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {job.progress_pct}% complete
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
