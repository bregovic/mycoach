"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WeightPoint = { label: string; weightKg: number; bodyFat: number | null };

export function WeightChart({ data, showBodyFat }: { data: WeightPoint[]; showBodyFat: boolean }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#71717a" }}
            tickLine={false}
            axisLine={{ stroke: "#e4e4e7" }}
            minTickGap={24}
          />
          <YAxis
            yAxisId="w"
            domain={["dataMin - 1", "dataMax + 1"]}
            tick={{ fontSize: 12, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          {showBodyFat && (
            <YAxis
              yAxisId="bf"
              orientation="right"
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 12, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
          )}
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e4e4e7",
              fontSize: 13,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            formatter={(value, name) => [
              `${value} ${name === "% tuku" ? "%" : "kg"}`,
              name,
            ]}
          />
          <Line
            yAxisId="w"
            type="monotone"
            dataKey="weightKg"
            name="Váha"
            stroke="#18181b"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          {showBodyFat && (
            <Line
              yAxisId="bf"
              type="monotone"
              dataKey="bodyFat"
              name="% tuku"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
