import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import {
  getAnalytics,
  getCompletionSeries,
  getHeatmap,
  getTaskPerformance,
  resolveSessionUserId,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Analytics · God Watch",
  description: "Your habit analytics, streaks, and performance.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = await resolveSessionUserId(session);

  const [analytics, series, heatmap, taskPerformance] = await Promise.all([
    getAnalytics(userId),
    getCompletionSeries(userId, 30),
    getHeatmap(userId, 365),
    getTaskPerformance(userId),
  ]);

  return (
    <AnalyticsView
      analytics={analytics}
      series={series}
      heatmap={heatmap}
      taskPerformance={taskPerformance}
    />
  );
}

