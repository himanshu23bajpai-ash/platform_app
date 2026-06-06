import { Card, CardContent, Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color ?? "text.primary" }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        {icon && (
          <Box sx={{ color: "text.secondary", fontSize: 28 }}>{icon}</Box>
        )}
      </CardContent>
    </Card>
  );
}
