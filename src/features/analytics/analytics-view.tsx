"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart3, CalendarRange, Flame, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Heatmap } from "@/features/analytics/heatmap";
import { formatMonth, type ISODate } from "@/lib/dates";
import type { HabitStats, TaskPerformance } from "@/lib/stats";
import { pluralize } from "@/lib/utils";

// Recharts is large; load it only on this page, after first paint.
const chartFallback = () => <Skeleton className="h-56 w-full" />;
const TrendChart = dynamic(() => import("@/features/analytics/charts").then((m) => m.TrendChart), { ssr: false, loading: chartFallback });
const StatusPie = dynamic(() => import("@/features/analytics/charts").then((m) => m.StatusPie), { ssr: false, loading: chartFallback });
const HabitBars = dynamic(() => import("@/features/analytics/charts").then((m) => m.HabitBars), { ssr: false, loading: chartFallback });

interface Props {
  today: ISODate;
  stats: HabitStats;
  trend: { date: ISODate; rate: number; completed: number; active: number }[];
  heatmap: { date: ISODate; rate: number; completed: number; active: number }[];
  performance: (TaskPerformance & { name: string; color: string })[];
}

export function AnalyticsView({ stats, trend, heatmap, performance }: Props) {
  const hasData = stats.totals.checked > 0 || stats.totals.unmarked > 0;

  if (!hasData) {
    return (
      <div className="container-page pt-6">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Analytics</h1>
        <div className="glass rounded-xl">
          <EmptyState
            icon={BarChart3}
            title="No evidence yet"
            description="Add a habit and mark a few days. Your streaks, trends and heatmap will appear here."
            action={
              <Button asChild>
                <Link href="/dashboard">Go to today</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const windows = [
    { label: "Today", value: stats.windows.daily },
    { label: "Last 7 days", value: stats.windows.weekly },
    { label: "Last 30 days", value: stats.windows.monthly },
    { label: "Last 365 days", value: stats.windows.yearly },
  ];
  const pie = [
    { name: "Completed", value: stats.totals.completed, color: "var(--success)" },
    { name: "Failed", value: stats.totals.failed, color: "var(--danger)" },
    { name: "Missed", value: stats.totals.missed, color: "var(--warning)" },
    { name: "Not marked", value: stats.totals.unmarked, color: "var(--fg-subtle)" },
  ];

  return (
    <div className="container-page space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-fg-muted">Your consistency, measured. Rates count only the days each habit was active.</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {windows.map((w) => (
          <div key={w.label} className="glass rounded-lg p-4">
            <dt className="text-xs text-fg-muted">{w.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight">{w.value.rate}%</dd>
            <dd className="text-xs text-fg-muted">
              {w.value.completed} of {w.value.slots} done
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Highlight icon={Flame} label="Current streak" value={pluralize(stats.currentStreak, "day")} />
        <Highlight icon={Trophy} label="Longest streak" value={pluralize(stats.longestStreak, "day")} />
        <Highlight
          icon={TrendingUp}
          label="Best month"
          value={stats.bestMonth ? `${formatMonth(stats.bestMonth.month, { month: "short", year: "numeric" })}, ${stats.bestMonth.rate}%` : "Not enough data"}
        />
        <Highlight
          icon={TrendingDown}
          label="Toughest month"
          value={stats.worstMonth && stats.worstMonth.month !== stats.bestMonth?.month ? `${formatMonth(stats.worstMonth.month, { month: "short", year: "numeric" })}, ${stats.worstMonth.rate}%` : "Not enough data"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <TrendingUp className="size-4 text-accent-text" aria-hidden /> Last 30 days
            </CardTitle>
            <CardDescription>Share of active habits completed each day.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Target className="size-4 text-accent-text" aria-hidden /> All-time outcomes
            </CardTitle>
            <CardDescription>Every active habit-day so far.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusPie data={pie} />
            <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
              {pie.map((p) => (
                <li key={p.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
                  <span className="text-fg-muted">{p.name}</span>
                  <span className="ml-auto font-medium">{p.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <CalendarRange className="size-4 text-accent-text" aria-hidden /> Year at a glance
          </CardTitle>
          <CardDescription>Darker squares mean more of that day&apos;s habits were completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Heatmap days={heatmap} />
        </CardContent>
      </Card>

      {performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <BarChart3 className="size-4 text-accent-text" aria-hidden /> By habit
            </CardTitle>
            <CardDescription>Completion rate since each habit started.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <HabitBars data={performance} />
            <Table label="Habit performance">
              <THead>
                <TR>
                  <TH>Habit</TH>
                  <TH className="text-right">Days</TH>
                  <TH className="text-right">Done</TH>
                  <TH className="text-right">Failed</TH>
                  <TH className="text-right">Missed</TH>
                  <TH className="text-right">Rate</TH>
                </TR>
              </THead>
              <TBody>
                {performance.map((p) => (
                  <TR key={p.taskId}>
                    <TD>
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                        <span className="max-w-40 truncate">{p.name}</span>
                      </span>
                    </TD>
                    <TD className="text-right tabular-nums">{p.activeDays}</TD>
                    <TD className="text-right tabular-nums">{p.completed}</TD>
                    <TD className="text-right tabular-nums">{p.failed}</TD>
                    <TD className="text-right tabular-nums">{p.missed}</TD>
                    <TD className="text-right font-medium tabular-nums">{p.rate}%</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Highlight({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="glass flex items-center gap-3 rounded-lg p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-text">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
    </div>
  );
}
