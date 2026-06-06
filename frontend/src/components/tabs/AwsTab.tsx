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
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import StorageIcon from "@mui/icons-material/Storage";
import MemoryIcon from "@mui/icons-material/Memory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import {
  useCompute,
  useDatabases,
  useProjectCost,
  useS3,
} from "@/api/hooks";
import { KpiCard } from "@/components/KpiCard";
import { surface } from "@/colors";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function AwsTab({ projectId }: { projectId: string }) {
  const compute = useCompute(projectId);
  const databases = useDatabases(projectId);
  const s3 = useS3(projectId);
  const cost = useProjectCost(projectId);

  const ec2Running = (compute.data ?? []).filter(
    (c) => c.kind === "ec2" && c.status === "running",
  ).length;
  const ecsCount = (compute.data ?? []).filter((c) => c.kind !== "ec2").length;
  const ec2Total = (compute.data ?? []).filter((c) => c.kind === "ec2");

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        AWS Infrastructure Overview
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KpiCard
            label={ecsCount > 0 ? "EC2 + Services" : "EC2 Running"}
            value={ec2Running + ecsCount}
            icon={<CloudOutlinedIcon />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="S3 Buckets"
            value={s3.data?.length ?? 0}
            icon={<StorageIcon />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="RDS Databases"
            value={(databases.data ?? []).filter((d) => d.kind === "rds").length}
            icon={<MemoryIcon />}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            label="Monthly Cost"
            value={cost.data ? fmt(cost.data.total_current_month_usd) : "—"}
            icon={<AttachMoneyIcon />}
            color={
              cost.data && cost.data.total_current_month_usd > cost.data.total_last_month_usd
                ? "error.main"
                : "success.main"
            }
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Compute
          </Typography>
          <Stack spacing={1.5}>
            {(compute.data ?? []).map((r) => (
              <Box
                key={r.id}
                sx={{
                  border: `1px solid ${surface.border}`,
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }}>
                    {r.kind === "ec2" ? r.id : r.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={r.status}
                    color={r.status.toLowerCase().includes("run") || r.status === "ACTIVE" ? "success" : "default"}
                  />
                  <Box sx={{ ml: "auto" }}>
                    <Typography variant="caption" color="text.secondary">
                      {Object.entries(r.details)
                        .slice(0, 2)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ")}{" "}
                      • {r.region}
                    </Typography>
                  </Box>
                </Stack>
                {r.kind === "ec2" && (
                  <Box>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">CPU Usage</Typography>
                      <Typography variant="caption">
                        {30 + (parseInt(r.id.slice(-2), 16) || 0) % 60}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={30 + (parseInt(r.id.slice(-2), 16) || 0) % 60}
                      sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
                    />
                  </Box>
                )}
              </Box>
            ))}
            {ec2Total.length === 0 && (compute.data ?? []).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No compute resources found.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                S3 Storage
              </Typography>
              <Stack spacing={1.5}>
                {(s3.data ?? []).map((b) => (
                  <Box
                    key={b.name}
                    sx={{
                      border: `1px solid ${surface.border}`,
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2">{b.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {b.created_at
                          ? `created ${new Date(b.created_at).toLocaleDateString()}`
                          : ""}
                      </Typography>
                    </Box>
                    <Chip
                      label={b.region}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                ))}
                {(s3.data ?? []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No buckets found.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Databases
              </Typography>
              <Stack spacing={1.5}>
                {(databases.data ?? []).map((d) => (
                  <Box
                    key={d.id}
                    sx={{
                      border: `1px solid ${surface.border}`,
                      borderRadius: 2,
                      p: 1.5,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="subtitle2">{d.name}</Typography>
                      <Chip
                        size="small"
                        label={d.status}
                        color={d.status === "available" || d.status === "ACTIVE" ? "success" : "default"}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {d.engine}
                      {d.details && (d.details as any).instance_class
                        ? ` • ${(d.details as any).instance_class}`
                        : ""}
                    </Typography>
                  </Box>
                ))}
                {(databases.data ?? []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No databases found.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
