import type { Metadata } from "next";
import { AnalyticsView } from "@/features/analytics/analytics-view";
import { getAnalyticsData } from "@/server/data";
import { requirePageUser } from "@/server/session";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requirePageUser();
  const data = await getAnalyticsData(user.id, user.today);
  return <AnalyticsView {...data} today={user.today} />;
}
