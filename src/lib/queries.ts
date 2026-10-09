import { prisma } from "@/lib/prisma";
import { computeStreaks } from "@/lib/streak";
import { percent } from "@/lib/utils";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import type {
  ActivityDTO,
  AnalyticsStats,
  DashboardSummary,
  HeatmapCell,
  StatusCellDTO,
  TaskDTO,
  TaskPerformance,
  UserStats,
} from "@/types";

/** Prisma CUID format: "c" followed by 24 lowercase alphanumeric chars. */
const CUID_REGEX = /^c[a-z0-9]{24}$/;

/**
 * Resolve the authenticated user's DB row id from a session object.
 *
 * Handles two session shapes:
 *  - Fresh sessions (after PrismaAdapter was wired): `token.id` is the real
 *    DB CUID, used directly.
 *  - Stale sessions (created before the adapter fix): `token.id` is the
 *    Google `sub` (long numeric id) which has no matching User row. In that
 *    case we fall back to looking the user up by email — this prevents the
 *    P2003 foreign-key failure on every write.
 */
export async function resolveSessionUserId(
  session: Session | null
): Promise<string> {
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const email = session?.user?.email;

  if (userId && typeof userId === "string" && CUID_REGEX.test(userId) && userId.length === 25) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (user) return user.id;
  }

  // Fallback for stale sessions / missing DB id: resolve by email.
  if (email && typeof email === "string") {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) return user.id;
  }

  throw new Error("Unauthorized");
}

/** Convenience wrapper that fetches the session and resolves the user id. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  return resolveSessionUserId(session);
}

/**
 * Server-side data access layer.
 * All queries are scoped to the requesting user (authorization / isolation).
 */

/** Fetch all active tasks for a user. */
export async function getTasks(userId: string): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    where: { userId, archived: false },
    orderBy: { order: "asc" },
  });
  return tasks.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    order: t.order,
    archived: t.archived,
    createdAt: t.createdAt.toISOString(),
  }));
}

/** Fetch all statuses for a user's tasks (all dates). */
export async function getStatuses(userId: string): Promise<
  Record<string, Record<string, StatusCellDTO["status"]>>
> {
  const statuses = await prisma.taskStatus.findMany({
    where: { task: { userId } },
    select: { taskId: true, date: true, status: true },
  });
  const result: Record<string, Record<string, StatusCellDTO["status"]>> = {};
  for (const s of statuses) {
    if (!result[s.taskId]) result[s.taskId] = {};
    result[s.taskId]![s.date] = s.status;
  }
  return result;
}

/** Fetch all notes for a user. */
export async function getNotes(userId: string): Promise<Record<string, string>> {
  const notes = await prisma.note.findMany({
    where: { userId },
    select: { date: true, content: true },
  });
  const result: Record<string, string> = {};
  for (const n of notes) result[n.date] = n.content;
  return result;
}

/** Compute the dashboard summary for a user. */
export async function getDashboardSummary(
  userId: string
): Promise<DashboardSummary> {
  const [tasks, statuses] = await Promise.all([
    prisma.task.findMany({ where: { userId, archived: false }, select: { id: true } }),
    prisma.taskStatus.findMany({
      where: { task: { userId } },
      select: { taskId: true, date: true, status: true },
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCells = statuses.filter((s) => s.date === today && tasks.some((t) => t.id === s.taskId));
  const todayCompleted = todayCells.filter((s) => s.status === "COMPLETED").length;
  const todayTotal = tasks.length;

  // Build day map for streaks
  const dayMap = new Map<string, { date: string; completed: number; total: number }>();
  const byDate = new Map<string, typeof statuses>();
  for (const s of statuses) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  for (const [date, cells] of byDate) {
    const completed = cells.filter((c) => c.status === "COMPLETED").length;
    dayMap.set(date, { date, completed, total: tasks.length });
  }
  const { currentStreak, longestStreak } = computeStreaks(dayMap);

  return {
    todayCompleted,
    todayTotal,
    currentStreak,
    longestStreak,
    completionRate: percent(todayCompleted, todayTotal),
  };
}

/** Compute full analytics for a user. */
export async function getAnalytics(userId: string): Promise<AnalyticsStats> {
  const [tasks, statuses] = await Promise.all([
    prisma.task.findMany({ where: { userId, archived: false }, select: { id: true } }),
    prisma.taskStatus.findMany({
      where: { task: { userId } },
      select: { taskId: true, date: true, status: true },
    }),
  ]);

  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const isoWeekAgo = new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10);
  const isoMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().slice(0, 10);
  const isoYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);

  const countInRange = (from: string, to: string, status: string) =>
    statuses.filter(
      (s) => s.date >= from && s.date <= to && s.status === status
    ).length;

  const totalCompleted = statuses.filter((s) => s.status === "COMPLETED").length;
  const totalFailed = statuses.filter((s) => s.status === "FAILED").length;
  const totalMissed = statuses.filter((s) => s.status === "MISSED").length;

  // Monthly best/worst (by completion rate)
  const byMonth = new Map<string, { completed: number; total: number }>();
  for (const s of statuses) {
    const month = s.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, { completed: 0, total: 0 });
    const m = byMonth.get(month)!;
    if (s.status === "COMPLETED") m.completed += 1;
    m.total += 1;
  }
  let bestMonth: AnalyticsStats["bestMonth"] = null;
  let worstMonth: AnalyticsStats["worstMonth"] = null;
  for (const [month, m] of byMonth) {
    const rate = Math.round((m.completed / m.total) * 100);
    const label = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    if (!bestMonth || rate > bestMonth.rate) bestMonth = { month: label, rate };
    if (!worstMonth || rate < worstMonth.rate) worstMonth = { month: label, rate };
  }

  // Streaks
  const dayMap = new Map<string, { date: string; completed: number; total: number }>();
  const byDate = new Map<string, typeof statuses>();
  for (const s of statuses) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  for (const [date, cells] of byDate) {
    const completed = cells.filter((c) => c.status === "COMPLETED").length;
    dayMap.set(date, { date, completed, total: tasks.length });
  }
  const { currentStreak, longestStreak } = computeStreaks(dayMap);

  return {
    daily: percent(countInRange(isoToday, isoToday, "COMPLETED"), tasks.length || 1),
    weekly: percent(countInRange(isoWeekAgo, isoToday, "COMPLETED"), tasks.length * 7 || 1),
    monthly: percent(countInRange(isoMonthAgo, isoToday, "COMPLETED"), tasks.length * 30 || 1),
    yearly: percent(countInRange(isoYearAgo, isoToday, "COMPLETED"), tasks.length * 365 || 1),
    currentStreak,
    longestStreak,
    totalCompleted,
    totalFailed,
    totalMissed,
    totalPending: statuses.length,
    bestMonth,
    worstMonth,
  };
}

/** Heatmap data for the last N days. */
export async function getHeatmap(userId: string, days = 365): Promise<HeatmapCell[]> {
  const since = new Date(Date.now() - days * 86400000);
  const sinceISO = since.toISOString().slice(0, 10);
  const [tasks, statuses] = await Promise.all([
    prisma.task.count({ where: { userId, archived: false } }),
    prisma.taskStatus.findMany({
      where: { task: { userId }, date: { gte: sinceISO } },
      select: { date: true, status: true },
    }),
  ]);

  const totalTasks = tasks || 1;
  const byDate = new Map<string, number>();
  for (const s of statuses) {
    if (s.status === "COMPLETED") {
      byDate.set(s.date, (byDate.get(s.date) ?? 0) + 1);
    }
  }

  const cells: HeatmapCell[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const count = byDate.get(iso) ?? 0;
    cells.push({ date: iso, count, rate: Math.round((count / totalTasks) * 100) });
  }
  return cells;
}

/** Per-task performance stats. */
export async function getTaskPerformance(userId: string): Promise<TaskPerformance[]> {
  const tasks = await prisma.task.findMany({
    where: { userId, archived: false },
    include: { taskStatuses: true },
  });
  return tasks.map((t) => {
    const completed = t.taskStatuses.filter((s) => s.status === "COMPLETED").length;
    const failed = t.taskStatuses.filter((s) => s.status === "FAILED").length;
    const missed = t.taskStatuses.filter((s) => s.status === "MISSED").length;
    const pending = t.taskStatuses.filter((s) => s.status === "PENDING").length;
    return {
      taskId: t.id,
      name: t.name,
      color: t.color,
      completed,
      failed,
      missed,
      pending,
      rate: percent(completed, completed + failed + missed + pending),
    };
  });
}

/** User lifetime stats for the profile page. */
export async function getUserStats(userId: string): Promise<UserStats> {
  const [tasks, statuses] = await Promise.all([
    prisma.task.count({ where: { userId, archived: false } }),
    prisma.taskStatus.findMany({
      where: { task: { userId } },
      select: { date: true, status: true },
    }),
  ]);

  const totalCompleted = statuses.filter((s) => s.status === "COMPLETED").length;
  const totalFailed = statuses.filter((s) => s.status === "FAILED").length;
  const totalMissed = statuses.filter((s) => s.status === "MISSED").length;
  const totalPending = statuses.filter((s) => s.status === "PENDING").length;

  const dayMap = new Map<string, { date: string; completed: number; total: number }>();
  const byDate = new Map<string, typeof statuses>();
  for (const s of statuses) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  for (const [date, cells] of byDate) {
    dayMap.set(date, { date, completed: cells.filter((c) => c.status === "COMPLETED").length, total: tasks });
  }
  const { currentStreak, longestStreak } = computeStreaks(dayMap);

  const totalChecked = totalCompleted + totalFailed + totalMissed;
  return {
    currentStreak,
    longestStreak,
    lifetimeCompletion: percent(totalCompleted, totalChecked),
    totalCompleted,
    totalFailed,
    totalMissed,
    totalPending,
    totalChecked,
  };
}

/** Recent activity feed. */
export async function getRecentActivity(userId: string, limit = 20): Promise<ActivityDTO[]> {
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return logs.map((l) => ({
    id: l.id,
    type: l.type,
    metadata: l.metadata as Record<string, unknown> | null,
    createdAt: l.createdAt.toISOString(),
  }));
}

/** User achievements with unlocked status. */
export async function getUserAchievements(userId: string) {
  const [achievements, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true, unlockedAt: true } }),
  ]);
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));
  return achievements.map((a) => ({
    id: a.id,
    key: a.key,
    name: a.name,
    description: a.description,
    icon: a.icon,
    unlockedAt: unlockedMap.get(a.id)?.toISOString() ?? null,
  }));
}

/** Get user settings. */
export async function getUserSettings(userId: string) {
  return prisma.settings.findUnique({ where: { userId } });
}

/** Daily completion series for charts. */
export async function getCompletionSeries(userId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const sinceISO = since.toISOString().slice(0, 10);
  const [tasks, statuses] = await Promise.all([
    prisma.task.count({ where: { userId, archived: false } }),
    prisma.taskStatus.findMany({
      where: { task: { userId }, date: { gte: sinceISO } },
      select: { date: true, status: true },
    }),
  ]);

  const totalTasks = tasks || 1;
  const byDate = new Map<string, { completed: number; total: number }>();
  for (const s of statuses) {
    if (!byDate.has(s.date)) byDate.set(s.date, { completed: 0, total: totalTasks });
    if (s.status === "COMPLETED") byDate.get(s.date)!.completed += 1;
  }

  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const day = byDate.get(iso) ?? { completed: 0, total: totalTasks };
    series.push({
      date: iso,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completion: percent(day.completed, day.total),
      completed: day.completed,
      total: day.total,
    });
  }
  return series;
}

