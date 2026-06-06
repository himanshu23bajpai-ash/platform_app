import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  useDeleteSecret,
  useProject,
  usePutSecret,
  useReadSecret,
  useSecrets,
} from "@/api/hooks";

export function SecretsTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: secrets, isLoading } = useSecrets(projectId);
  const put = usePutSecret(projectId);
  const del = useDeleteSecret(projectId);
  const read = useReadSecret();

  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  if (isLoading) return <LinearProgress />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !value) return;
    await put.mutateAsync({ key, value, description });
    setKey("");
    setValue("");
    setDescription("");
  };

  const toggleReveal = async (k: string) => {
    if (revealed[k] !== undefined) {
      const { [k]: _, ...rest } = revealed;
      setRevealed(rest);
      return;
    }
    const r = await read.mutateAsync({ projectId, key: k });
    setRevealed((s) => ({ ...s, [k]: r.value }));
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        AWS Secrets
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stored under <code>platform/{project?.name}/&lt;key&gt;</code> in AWS Secrets Manager (or
        the in-memory mock store when AWS is not configured).
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent component="form" onSubmit={submit}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Create or update secret
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              size="small"
              label="Key"
              placeholder="db_password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Value"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="contained" disabled={put.isPending}>
              {put.isPending ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Last changed</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(secrets ?? []).map((s) => (
              <TableRow key={s.name}>
                <TableCell sx={{ fontFamily: "monospace" }}>{s.name}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {revealed[s.name] !== undefined ? (
                      <Box
                        component="code"
                        sx={{ bgcolor: "#fef9c3", px: 1, py: 0.25, borderRadius: 1 }}
                      >
                        {revealed[s.name]}
                      </Box>
                    ) : (
                      <Box component="code" sx={{ color: "text.disabled" }}>
                        ••••••••
                      </Box>
                    )}
                    <IconButton size="small" onClick={() => toggleReveal(s.name)}>
                      {revealed[s.name] !== undefined ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell>{s.description || "—"}</TableCell>
                <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                  {s.last_changed ? new Date(s.last_changed).toLocaleString() : "—"}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (confirm(`Delete "${s.name}"?`)) del.mutate(s.name);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(secrets ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                  No secrets yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
