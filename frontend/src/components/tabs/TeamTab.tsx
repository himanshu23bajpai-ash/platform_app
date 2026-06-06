import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  useAddAssignment,
  useAssignments,
  useRemoveAssignment,
  useUsers,
} from "@/api/hooks";

export function TeamTab({ projectId }: { projectId: string }) {
  const { data: assignments, isLoading } = useAssignments(projectId);
  const { data: users } = useUsers();
  const add = useAddAssignment(projectId);
  const remove = useRemoveAssignment(projectId);
  const [picked, setPicked] = useState("");

  if (isLoading) return <LinearProgress />;

  const assignedIds = new Set(assignments?.map((a) => a.user_id));
  const candidates = (users ?? []).filter(
    (u) => u.is_active && !assignedIds.has(u.id) && u.role !== "ADMIN",
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Team
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Admins always have access. Add Project Managers or Viewers below to grant project access.
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              select
              size="small"
              label="Select user"
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">— pick a user —</MenuItem>
              {candidates.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email} ({u.role.replace("PROJECT_", "")})
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              disabled={!picked || add.isPending}
              onClick={async () => {
                await add.mutateAsync(picked);
                setPicked("");
              }}
            >
              Assign
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(assignments ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.user.email}</TableCell>
                <TableCell>{a.user.name || "—"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={a.user.role.replace("PROJECT_", "")}
                    color={a.user.role === "PROJECT_MANAGER" ? "secondary" : "default"}
                  />
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => remove.mutate(a.user_id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(assignments ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                  No users assigned yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
