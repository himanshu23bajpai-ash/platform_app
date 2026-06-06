import Highcharts from "highcharts";
import { chart, text } from "@/colors";

// Apply a global Highcharts theme so every chart starts purple by default.
Highcharts.setOptions({
  colors: chart.series as unknown as string[],
  chart: {
    backgroundColor: chart.background,
    style: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
    },
  },
  title: { text: undefined },
  credits: { enabled: false },
  legend: {
    itemStyle: { color: text.secondary, fontWeight: "500" },
    itemHoverStyle: { color: text.primary },
  },
  xAxis: {
    lineColor: chart.grid,
    tickColor: chart.grid,
    labels: { style: { color: chart.axisLabel, fontSize: "12px" } },
  },
  yAxis: {
    gridLineColor: chart.grid,
    labels: { style: { color: chart.axisLabel, fontSize: "12px" } },
    title: { text: undefined },
  },
  plotOptions: {
    series: { animation: { duration: 600 } },
    line: { marker: { lineWidth: 0, radius: 3 } },
    column: { borderWidth: 0, borderRadius: 4 },
  },
  tooltip: {
    backgroundColor: "rgba(15,23,42,0.92)",
    style: { color: "#fff", fontSize: "12px" },
    borderWidth: 0,
    borderRadius: 6,
    shadow: false,
  },
});

export { Highcharts };
