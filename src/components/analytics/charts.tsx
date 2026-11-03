"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TaskPerformance } from "@/types";

/** Completion trend line/area chart (last 30 days). */
export function CompletionTrendChart({
  data,
}: {
  data: { date: string; label: string; completion: number; completed: number; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          unit="%"
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: "linear-gradient(145deg, var(--glass-strong-a), var(--glass-strong-b))",
            color: "hsl(var(--foreground))",
            border: "1px solid var(--glass-edge)",
            borderRadius: 14,
            fontSize: 12,
          }}
          formatter={(value: number | string) => [`${value}%`, "Completion"]}
        />
        <Area
          type="monotone"
          dataKey="completion"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#completionGrad)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Distribution pie chart for statuses. */
export function StatusPieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No data yet — start tracking to see insights.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={90}
          paddingAngle={3}
        >
          {filtered.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "linear-gradient(145deg, var(--glass-strong-a), var(--glass-strong-b))",
            color: "hsl(var(--foreground))",
            border: "1px solid var(--glass-edge)",
            borderRadius: 14,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Per-task performance horizontal bar chart. */
export function TaskPerformanceChart({ data }: { data: TaskPerformance[] }) {
  const sorted = [...data].sort((a, b) => b.rate - a.rate);
  if (sorted.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No tasks yet.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" horizontal={false} />
        <XAxis type="number" unit="%" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip
          contentStyle={{
            background: "linear-gradient(145deg, var(--glass-strong-a), var(--glass-strong-b))",
            color: "hsl(var(--foreground))",
            border: "1px solid var(--glass-edge)",
            borderRadius: 14,
            fontSize: 12,
          }}
          formatter={(value: number | string) => [`${value}%`, "Completion rate"]}
        />
        <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
          {sorted.map((t) => (
            <Cell key={t.taskId} fill={t.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Daily completed counts bar chart. */
export function DailyBarsChart({
  data,
}: {
  data: { label: string; completed: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "linear-gradient(145deg, var(--glass-strong-a), var(--glass-strong-b))",
            color: "hsl(var(--foreground))",
            border: "1px solid var(--glass-edge)",
            borderRadius: 14,
            fontSize: 12,
          }}
        />
        <Bar dataKey="completed" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

