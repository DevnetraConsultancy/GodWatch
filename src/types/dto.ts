import type { ISODate } from "@/lib/dates";
import type { StatusValue } from "@/lib/status";
import type { AchievementIcon } from "@/lib/achievements";

/** Shapes passed from the server to client components. */

export interface TaskDTO {
  id: string;
  name: string;
  color: string;
  order: number;
  startDate: ISODate;
  archivedOn: ISODate | null;
}

/** `taskId -> date -> status` (PENDING cells are absent). */
export type StatusMap = Record<string, Record<ISODate, StatusValue>>;

export interface SummaryDTO {
  todayCompleted: number;
  todayActive: number;
  todayRate: number;
  currentStreak: number;
  longestStreak: number;
  lifetimeCompletion: number;
  totalCompleted: number;
}

export interface AchievementDTO {
  key: string;
  name: string;
  description: string;
  icon: AchievementIcon;
  unlockedAt: string | null;
}

export interface UnlockedAchievement {
  key: string;
  name: string;
}

export interface ActivityDTO {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
}

export interface SearchResult {
  kind: "habit" | "note" | "date";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
