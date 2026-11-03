"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Mail,
  Minus,
  Trophy,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ActivityDTO, UserStats } from "@/types";

interface ProfileViewProps {
  user: {
    name: string;
    email: string;
    image?: string;
  };
  joinedAt: string;
  stats: UserStats;
  achievements: {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string | null;
  }[];
  recentActivity: ActivityDTO[];
}

const ACTIVITY_LABELS: Record<string, string> = {
  TASK_CREATED: "created a task",
  TASK_RENAMED: "renamed a task",
  TASK_DELETED: "deleted a task",
  TASK_ARCHIVED: "archived a task",
  TASK_UNARCHIVED: "restored a task",
  TASK_REORDERED: "reordered tasks",
  TASK_COLOR_CHANGED: "changed a task color",
  STATUS_CHANGED: "updated a status",
  LOGIN: "logged in",
  LOGOUT: "logged out",
  SETTINGS_CHANGED: "updated settings",
  NOTE_UPDATED: "updated a note",
  ACHIEVEMENT_UNLOCKED: "unlocked an achievement",
};

/** Profile page — user info, stats, achievements, and recent activity. */
export function ProfileView({
  user,
  joinedAt,
  stats,
  achievements,
  recentActivity,
}: ProfileViewProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const joined = new Date(joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-3 py-8 sm:px-4">
      {/* Header card */}
      <div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image} alt={user.name} referrerPolicy="no-referrer" />
              <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
              <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span suppressHydrationWarning>Joined {joined}</span>
                </Badge>
                <Badge variant="secondary">
                  <Trophy className="mr-1 h-3 w-3" />
                  {unlockedCount} achievements
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Current Streak"
          value={`${stats.currentStreak}d`}
          icon={<Flame className="h-4 w-4 text-warning" />}
        />
        <StatTile
          label="Longest Streak"
          value={`${stats.longestStreak}d`}
          icon={<Trophy className="h-4 w-4 text-warning" />}
        />
        <StatTile
          label="Lifetime Completion"
          value={`${stats.lifetimeCompletion}%`}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        />
        <StatTile
          label="Total Checked"
          value={stats.totalChecked}
          icon={<UserIcon className="h-4 w-4 text-primary" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Completed"
          value={stats.totalCompleted}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        />
        <StatTile
          label="Failed"
          value={stats.totalFailed}
          icon={<XCircle className="h-4 w-4 text-danger" />}
        />
        <StatTile
          label="Missed"
          value={stats.totalMissed}
          icon={<Minus className="h-4 w-4 text-warning" />}
        />
        <StatTile
          label="Pending"
          value={stats.totalPending}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Achievements */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-warning" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-center ${
                    a.unlockedAt ? "border-primary/40 bg-primary/10" : "border-[var(--hairline)] opacity-60"
                  }`}
                >
                  <span className="text-3xl" aria-hidden>
                    {a.unlockedAt ? a.icon : "🔒"}
                  </span>
                  <p className="text-xs font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  {a.unlockedAt && (
                    <Badge variant="success" className="mt-1 text-xs">
                      Unlocked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Start tracking to build your history.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((act) => {
                  const label = ACTIVITY_LABELS[act.type] ?? act.type.toLowerCase();
                  const date = new Date(act.createdAt);
                  const meta = act.metadata as Record<string, unknown> | null;
                  const rawTaskName = meta?.name ?? (act.type === "TASK_RENAMED" ? meta?.to : null) ?? null;
                  const taskName = typeof rawTaskName === "string" ? rawTaskName : null;
                  return (
                    <li key={act.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="flex-1">
                        You {label}
                        {typeof taskName === "string" && (
                          <span className="font-medium"> “{taskName}”</span>
                        )}
                        {typeof meta?.date === "string" && (
                          <span className="text-muted-foreground">
                            {" "}on {meta.date}
                          </span>
                        )}
                      </span>
                      <time
                        suppressHydrationWarning
                        className="shrink-0 text-xs text-muted-foreground"
                        dateTime={act.createdAt}
                      >
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div>{icon}</div>
          <div>
            <p className="font-display text-xl font-semibold leading-tight tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

