import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { AchievementGrid } from "@/features/profile/achievement-grid";
import { getAchievements, getHabitHistory, getRecentActivity } from "@/server/data";
import { requirePageUser } from "@/server/session";
import { computeHabitStats } from "@/lib/stats";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

function formatWhen(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString("en-US", { timeZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function ProfilePage() {
  const user = await requirePageUser();
  const [{ tasks, cells }, achievements, activity] = await Promise.all([
    getHabitHistory(user.id),
    getAchievements(user.id),
    getRecentActivity(user.id, 15),
  ]);
  const stats = computeHabitStats(tasks, cells, user.today);
  const joined = new Date(user.joinedAt).toLocaleDateString("en-US", { timeZone: user.timeZone, month: "long", year: "numeric" });
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  const lifetime = [
    { label: "Current streak", value: pluralize(stats.currentStreak, "day") },
    { label: "Longest streak", value: pluralize(stats.longestStreak, "day") },
    { label: "Lifetime completion", value: `${stats.lifetimeCompletion}%` },
    { label: "Perfect days", value: stats.perfectDays.toLocaleString() },
    { label: "Completed", value: stats.totals.completed.toLocaleString() },
    { label: "Failed", value: stats.totals.failed.toLocaleString() },
    { label: "Missed", value: stats.totals.missed.toLocaleString() },
    { label: "Habits", value: tasks.filter((t) => !t.archivedOn).length.toLocaleString() },
  ];

  return (
    <div className="container-page space-y-6 pt-6">
      <section className="glass flex flex-col items-start gap-4 rounded-xl p-6 sm:flex-row sm:items-center">
        <Avatar name={user.name} image={user.image} size={72} />
        <div className="min-w-0">
          <h1 className="font-display truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="truncate text-sm text-fg-muted">{user.email}</p>
          <p className="mt-1 text-xs text-fg-subtle">
            Member since {joined} · {user.timeZone}
          </p>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {lifetime.map((s) => (
          <div key={s.label} className="glass rounded-lg p-4">
            <dt className="text-xs text-fg-muted">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>
              {unlocked} of {achievements.length} unlocked. Badges stay yours once earned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AchievementGrid achievements={achievements} timeZone={user.timeZone} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <Activity className="size-4 text-accent-text" aria-hidden /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState icon={Activity} title="Nothing yet" description="Your changes will appear here." className="py-6" />
            ) : (
              <ol className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 break-words">{a.summary}</span>
                    <time dateTime={a.createdAt} className="shrink-0 text-xs text-fg-subtle">
                      {formatWhen(a.createdAt, user.timeZone)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
