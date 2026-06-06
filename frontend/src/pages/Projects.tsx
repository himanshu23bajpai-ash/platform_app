import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/Restore";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useDeleteProject,
  useMe,
  useProjects,
  useRestoreProject,
} from "@/api/hooks";
import type { Lifecycle } from "@/types";

const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  ACTIVE: "Active",
  IN_DEVELOPMENT: "In Development",
  DEPRECATED: "Deprecated",
};

const LIFECYCLE_COLOR: Record<
  Lifecycle,
  "success" | "warning" | "default"
> = {
  ACTIVE: "success",
  IN_DEVELOPMENT: "warning",
  DEPRECATED: "default",
};

export function Projects() {
  const { data: me } = useMe();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { data, isLoading, error } = useProjects(includeDeleted);
  const del = useDeleteProject();
  const restore = useRestoreProject();
  const isAdmin = me?.role === "ADMIN";

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Your Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage AWS infrastructure, AI models, and application activities
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}>
          {isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Show deleted</Typography>}
            />
          )}
          {isAdmin && (
            <Button
              component={Link}
              to="/onboard"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Onboard project
            </Button>
          )}
        </Box>
      </Box>

      {isLoading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">Failed to load projects.</Typography>}

      {data && data.length === 0 && (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {isAdmin
              ? "No projects yet. Click Onboard to add one."
              : "No projects assigned to you."}
          </Typography>
        </Card>
      )}

      <Grid container spacing={2}>
        {(data ?? []).map((p) => {
          const deleted = !!p.deleted_at;
          const lifecycle = (p.lifecycle ?? "ACTIVE") as Lifecycle;
          return (
            <Grid key={p.id} item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  opacity: deleted ? 0.6 : 1,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: "#ede9fe",
                        color: "primary.main",
                        width: 40,
                        height: 40,
                      }}
                    >
                      <CloudOutlinedIcon />
                    </Avatar>
                    <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                      {deleted ? (
                        <Chip label="Deleted" size="small" color="error" />
                      ) : (
                        <Chip
                          label={LIFECYCLE_LABEL[lifecycle]}
                          size="small"
                          color={LIFECYCLE_COLOR[lifecycle]}
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {p.description || "(no description)"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip label={p.compute_type.toUpperCase()} size="small" variant="outlined" />
                    <Chip label={p.aws_region} size="small" variant="outlined" />
                    <Chip
                      label={`${p.steps_completed}/${p.steps_total} steps`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  {!deleted ? (
                    <Button
                      component={Link}
                      to={`/projects/${p.id}`}
                      fullWidth
                      variant="contained"
                    >
                      View Details
                    </Button>
                  ) : (
                    isAdmin && (
                      <Button
                        fullWidth
                        color="success"
                        variant="outlined"
                        startIcon={<RestoreIcon />}
                        onClick={() => restore.mutate(p.id)}
                      >
                        Restore
                      </Button>
                    )
                  )}
                  {!deleted && isAdmin && (
                    <Tooltip title="Soft-delete project">
                      <IconButton
                        color="error"
                        onClick={() => {
                          if (confirm(`Soft-delete "${p.name}"?`)) del.mutate(p.id);
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
