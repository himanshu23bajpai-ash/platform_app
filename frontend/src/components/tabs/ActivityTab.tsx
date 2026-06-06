import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import BugReportIcon from "@mui/icons-material/BugReport";
import CodeIcon from "@mui/icons-material/Code";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useProjectActivity } from "@/api/hooks";
import { KpiCard } from "@/components/KpiCard";

const SEV_COLOR: Record<string, "error" | "warning" | "default"> = {
  high: "error",
  medium: "warning",
  low: "default",
};

const STATUS_COLOR: Record<string, "success" | "error" | "info" | "default"> = {
  success: "success",
  failed: "error",
  running: "info",
};

export function ActivityTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectActivity(projectId);
  if (isLoading || !data) return <LinearProgress />;
  const m = data.metrics;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Application Activity &amp; Monitoring
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Active Users"
            value={m.active_users.toLocaleString()}
            icon={<PeopleAltIcon />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Deployments (7d)"
            value={m.deployments_7d}
            icon={<RocketLaunchIcon />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Active Errors"
            value={m.active_errors}
            icon={<BugReportIcon />}
            color={m.active_errors > 20 ? "error.main" : "warning.main"}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Commits (30d)"
            value={m.commits_30d}
            icon={<CodeIcon />}
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Request Volume &amp; Errors (24h)
          </Typography>
          <Box sx={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data.requests_24h} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#5b21b6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#c084fc"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Recent Deployments
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>When</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.deployments.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontFamily: "monospace" }}>{d.version}</TableCell>
                      <TableCell>{d.environment}</TableCell>
                      <TableCell>
                        <Chip
                          label={d.status}
                          size="small"
                          color={STATUS_COLOR[d.status] ?? "default"}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                        {new Date(d.when).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Active Errors
              </Typography>
              <Stack spacing={1.5}>
                {data.errors.map((err) => (
                  <Box
                    key={err.code}
                    sx={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                      p: 1.5,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>
                        {err.code}
                      </Typography>
                      <Chip
                        size="small"
                        icon={<WarningAmberIcon />}
                        label={err.severity}
                        color={SEV_COLOR[err.severity] ?? "default"}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {err.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {err.occurrences} occurrences • First seen{" "}
                      {new Date(err.first_seen).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
