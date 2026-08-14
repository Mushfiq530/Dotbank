import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

/**
 * type: "line" | "bar"
 * series: [{ key: "balance", color: "#1768AC", name: "Balance" }, ...]
 */
export default function MonthlyChart({ data, series, type = "line", height = 220 }) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textColor = theme === "dark" ? "#94A3B8" : "#6B7280";

  const Chart = type === "bar" ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: textColor }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: textColor }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: theme === "dark" ? "#131B2E" : "#FFFFFF",
            border: "none",
            borderRadius: 10,
            fontSize: 12,
            color: theme === "dark" ? "#E5E9F0" : "#1A2233",
          }}
        />
        {series.map((s) =>
          type === "bar" ? (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
