import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GridView } from "@/components/dashboard/grid-view";
import {
  getDashboardSummary,
  getStatuses,
  getTasks,
  getUserStats,
  resolveSessionUserId,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = await resolveSessionUserId(session);

  const [tasks, statuses, summary, stats] = await Promise.all([
    getTasks(userId),
    getStatuses(userId),
    getDashboardSummary(userId),
    getUserStats(userId),
  ]);

  return (
    <GridView
      initialTasks={tasks}
      initialStatuses={statuses}
      summary={summary}
      sessionUser={{
        name: session.user.name ?? "God Watcher",
        email: session.user.email ?? "",
        image: session.user.image ?? null,
      }}
      stats={stats}
    />
  );
}
