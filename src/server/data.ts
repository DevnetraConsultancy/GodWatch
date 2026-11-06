import "server-only";
import type { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { ACHIEVEMENT_DEFINITIONS, type AchievementIcon } from "@/lib/achievements";
import { formatDate, type ISODate } from "@/lib/dates";
import {
  computeHabitStats,
  computeTaskPerformance,
  dailySeries,
  type Cell,
  type HabitStats,
} from "@/lib/stats";
import { STATUS_LABELS, isStatus } from "@/lib/status";
import type { AchievementDTO, ActivityDTO, StatusMap, SummaryDTO, TaskDTO } from "@/types/dto";
import type { WeekTimes } from "@/lib/schedule";

/**
 * Read-side data access. Every query is scoped to the given user id, which
 * callers must take from the verified session, never from client input.
 */

const taskSelect = {
  id: true,
  name: true,
  color: true,
  order: true,
  startDate: true,
  archivedOn: true,
  times: true,
} satisfies Prisma.TaskSelect;

/** The `times` JSON column, as written by the Zod-validated update action. */
export function asWeekTimes(value: Prisma.JsonValue | null): WeekTimes | null {
  return (value ?? null) as WeekTimes | null;
}

export async function getTasks(userId: string, { includeArchived = false } = {}): Promise<TaskDTO[]> {
  const rows = await prisma.task.findMany({
    where: { userId, ...(includeArchived ? {} : { archivedOn: null }) },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: taskSelect,
  });
  return rows.map((t) => ({ ...t, times: asWeekTimes(t.times) }));
}

async function getCells(userId: string): Promise<Cell[]> {
  const rows = await prisma.taskStatus.findMany({
    where: { task: { userId } },
    select: { taskId: true, date: true, status: true },
  });
  return rows;
}

/** All habits (including archived) and all cells: the input for every statistic. */
export async function getHabitHistory(userId: string): Promise<{ tasks: TaskDTO[]; cells: Cell[] }> {
  const [tasks, cells] = await Promise.all([getTasks(userId, { includeArchived: true }), getCells(userId)]);
  return { tasks, cells };
}

export function toStatusMap(cells: Cell[], taskIds: Set<string>): StatusMap {
  const map: StatusMap = {};
  for (const c of cells) {
    if (!taskIds.has(c.taskId) || c.status === "PENDING") continue;
    (map[c.taskId] ??= {})[c.date] = c.status;
  }
  return map;
}

export function toSummary(stats: HabitStats): SummaryDTO {
  return {
    todayCompleted: stats.today.completed,
    todayActive: stats.today.active,
    todayRate: stats.windows.daily.rate,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lifetimeCompletion: stats.lifetimeCompletion,
    totalCompleted: stats.totals.completed,
  };
}

export async function getDashboardData(userId: string, today: ISODate) {
  const [{ tasks, cells }, notes] = await Promise.all([
    getHabitHistory(userId),
    prisma.note.findMany({ where: { userId, NOT: { content: "" } }, select: { date: true } }),
  ]);
  const active = tasks.filter((t) => t.archivedOn === null);
  return {
    tasks: active,
    statuses: toStatusMap(cells, new Set(active.map((t) => t.id))),
    noteDates: notes.map((n) => n.date),
    summary: toSummary(computeHabitStats(tasks, cells, today)),
    archivedCount: tasks.length - active.length,
  };
}

export async function getAnalyticsData(userId: string, today: ISODate) {
  const { tasks, cells } = await getHabitHistory(userId);
  const stats = computeHabitStats(tasks, cells, today);
  const performance = computeTaskPerformance(tasks, cells, today);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return {
    stats,
    trend: dailySeries(tasks, cells, today, 30),
    heatmap: dailySeries(tasks, cells, today, 371),
    performance: performance
      .filter((p) => byId.get(p.taskId)?.archivedOn === null)
      .map((p) => ({ ...p, name: byId.get(p.taskId)!.name, color: byId.get(p.taskId)!.color })),
  };
}

export async function getAchievements(userId: string): Promise<AchievementDTO[]> {
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { unlockedAt: true, achievement: { select: { key: true } } },
  });
  const when = new Map(unlocked.map((u) => [u.achievement.key, u.unlockedAt.toISOString()]));
  return ACHIEVEMENT_DEFINITIONS.map((d) => ({
    key: d.key,
    name: d.name,
    description: d.description,
    icon: d.icon as AchievementIcon,
    unlockedAt: when.get(d.key) ?? null,
  }));
}

function metaString(meta: Prisma.JsonValue | null, key: string): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const value = (meta as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

/** Plain-English line for an activity entry. */
export function describeActivity(type: ActivityType, meta: Prisma.JsonValue | null): string {
  const name = metaString(meta, "name");
  const quoted = name ? `"${name}"` : "a habit";
  switch (type) {
    case "TASK_CREATED":
      return `Added ${quoted}`;
    case "TASK_RENAMED":
      return `Renamed "${metaString(meta, "from") ?? "habit"}" to "${metaString(meta, "to") ?? ""}"`;
    case "TASK_DELETED":
      return `Deleted ${quoted}`;
    case "TASK_ARCHIVED":
      return `Archived ${quoted}`;
    case "TASK_UNARCHIVED":
      return `Restored ${quoted}`;
    case "TASK_REORDERED":
      return "Reordered habits";
    case "TASK_COLOR_CHANGED":
      return `Changed the colour of ${quoted}`;
    case "STATUS_CHANGED": {
      const to = metaString(meta, "to");
      const date = metaString(meta, "date");
      const label = to && isStatus(to) ? STATUS_LABELS[to] : "updated";
      return `Marked ${quoted} ${label.toLowerCase()}${date ? ` for ${formatDate(date)}` : ""}`;
    }
    case "NOTE_UPDATED": {
      const date = metaString(meta, "date");
      return `Updated the note${date ? ` for ${formatDate(date)}` : ""}`;
    }
    case "SETTINGS_CHANGED":
      return "Updated settings";
    case "ACHIEVEMENT_UNLOCKED":
      return `Unlocked the ${quoted} badge`;
    case "LOGIN":
      return "Signed in";
    case "LOGOUT":
      return "Signed out";
  }
}

export async function getRecentActivity(userId: string, take = 15): Promise<ActivityDTO[]> {
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, type: true, metadata: true, createdAt: true },
  });
  return logs.map((l) => ({
    id: l.id,
    type: l.type,
    summary: describeActivity(l.type, l.metadata),
    createdAt: l.createdAt.toISOString(),
  }));
}
