"use client";

import {
  Activity,
  Calendar,
  CheckCircle2,
  Flame,
  TrendingUp,
  Trophy,
  AlertCircle,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/analytics/stat-card";
import { Heatmap } from "@/components/analytics/heatmap";
import {
  CompletionTrendChart,
  DailyBarsChart,
  StatusPieChart,
  TaskPerformanceChart,
} from "@/components/analytics/charts";
import type {
  AnalyticsStats,
  HeatmapCell,
  TaskPerformance,
} from "@/types";

interface AnalyticsViewProps {
  analytics: AnalyticsStats;
  series: { date: string; label: string; completion: number; completed: number; total: number }[];
  heatmap: HeatmapCell[];
  taskPerformance: TaskPerformance[];
}

/** Analytics dashboard. */
export function AnalyticsView({
  analytics,
  series,
  heatmap,
  taskPerformance,
}: AnalyticsViewProps) {
  const pieData = [
    { name: "Completed", value: analytics.totalCompleted, color: "hsl(var(--success))" },
    { name: "Failed", value: analytics.totalFailed, color: "hsl(var(--danger))" },
    { name: "Missed", value: analytics.totalMissed, color: "hsl(var(--warning))" },
    { name: "Pending", value: analytics.totalPending, color: "hsl(var(--muted-foreground))" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-3 py-8 sm:px-4">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your consistency, measured. Every day leaves evidence.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Daily"
          value={`${analytics.daily}%`}
          sub="Today's completion"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Weekly"
          value={`${analytics.weekly}%`}
          sub="Last 7 days"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="Monthly"
          value={`${analytics.monthly}%`}
          sub="Last 30 days"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Yearly"
          value={`${analytics.yearly}%`}
          sub="Last 365 days"
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Current Streak"
          value={`${analytics.currentStreak}d`}
          sub="Keep it going!"
          icon={<Flame className="h-4 w-4 text-warning" />}
        />
        <StatCard
          label="Longest Streak"
          value={`${analytics.longestStreak}d`}
          sub="Your personal best"
          icon={<Trophy className="h-4 w-4 text-warning" />}
        />
        <StatCard
          label="Best Month"
          value={analytics.bestMonth?.month ?? "—"}
          sub={analytics.bestMonth ? `${analytics.bestMonth.rate}% completion` : "No data yet"}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        />
        <StatCard
          label="Worst Month"
          value={analytics.worstMonth?.month ?? "—"}
          sub={analytics.worstMonth ? `${analytics.worstMonth.rate}% completion` : "No data yet"}
          icon={<AlertCircle className="h-4 w-4 text-danger" />}
        />
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consistency heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap data={heatmap} />
        </CardContent>
      </Card>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionTrendChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={pieData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyBarsChart data={series.map((s) => ({ label: s.label, completed: s.completed }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskPerformanceChart data={taskPerformance} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

