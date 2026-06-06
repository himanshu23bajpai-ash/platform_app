import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HighchartsReact from "highcharts-react-official";
import { useMemo } from "react";
import { useProjectCost } from "@/api/hooks";
import { KpiCard } from "@/components/KpiCard";
import { Highcharts } from "@/charts/setup";
import { chart } from "@/colors";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function CostTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectCost(projectId);

  const chartOptions = useMemo<Highcharts.Options | null>(() => {
    if (!data) return null;
    return {
      chart: { type: "column", height: 280 },
      xAxis: { categories: data.last_6_months.map((m) => m.month) },
      yAxis: { labels: { format: "${value}" } },
      tooltip: { pointFormat: "<b>${point.y:,.2f}</b>" },
      series: [
        {
          type: "column",
          name: "Spend",
          data: data.last_6_months.map((m) => m.amount_usd),
          color: chart.accent,
        },
      ],
      legend: { enabled: false },
    };
  }, [data]);

  if (isLoading || !data) return <LinearProgress />;
  const trend =
    data.total_last_month_usd > 0
      ? ((data.total_current_month_usd - data.total_last_month_usd) /
          data.total_last_month_usd) *
        100
      : 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Cost
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <KpiCard
            label="This month"
            value={fmt(data.total_current_month_usd)}
            icon={<AttachMoneyIcon />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <KpiCard label="Last month" value={fmt(data.total_last_month_usd)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <KpiCard
            label="Trend"
            value={`${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`}
            icon={trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            color={trend >= 0 ? "error.main" : "success.main"}
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            By service (this month)
          </Typography>
          <Stack spacing={1.5}>
            {data.breakdown.map((b) => {
              const pct = (b.amount_usd / data.total_current_month_usd) * 100 || 0;
              return (
                <Box key={b.service}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">{b.service}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fmt(b.amount_usd)} ({pct.toFixed(1)}%)
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
                  />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Last 6 months
          </Typography>
          {chartOptions && <HighchartsReact highcharts={Highcharts} options={chartOptions} />}
        </CardContent>
      </Card>
    </Box>
  );
}
