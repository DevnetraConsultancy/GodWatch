"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "@/lib/dates";

const axis = { stroke: "var(--fg-subtle)", fontSize: 12, tickLine: false, axisLine: false } as const;
const tooltipStyle = {
  contentStyle: {
    background: "var(--glass-strong)",
    borderRadius: 0,
    boxShadow: "var(--glass-shadow)",
    color: "var(--fg)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--fg-muted)" },
} as const;

export function TrendChart({ data }: { data: { date: string; rate: number; completed: number; active: number }[] }) {
  // Days with no active habit are gaps, not 0%.
  const points = data.map((d) => ({ date: d.date, rate: d.active > 0 ? d.rate : null }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" {...axis} tickFormatter={(d: string) => formatDate(d)} minTickGap={24} />
        <YAxis {...axis} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} width={44} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(d: string) => formatDate(d, { weekday: "short", month: "short", day: "numeric" })}
          formatter={(v: number) => [`${v}%`, "Completed"]}
        />
        <Area type="monotone" dataKey="rate" stroke="var(--accent)" strokeWidth={2} fill="url(#trend-fill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none" isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HabitBars({ data }: { data: { name: string; rate: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} {...axis} tickFormatter={(v: number) => `${v}%`} />
        <YAxis type="category" dataKey="name" {...axis} width={120} tickFormatter={(n: string) => (n.length > 16 ? `${n.slice(0, 15)}...` : n)} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--glass-hover)" }} formatter={(v: number) => [`${v}%`, "Completion"]} />
        <Bar dataKey="rate" radius={0} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
