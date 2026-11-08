import { addDays, dateRange, minDate, monthKey, type ISODate } from "@/lib/dates";
import type { StatusValue } from "@/lib/status";

/**
 * Habit statistics engine ("fair history").
 *
 * A habit is *active* on a day from its start date up to, but not including,
 * the day it was archived. Only active habits count toward a day, so adding a
 * habit today never changes how past days score, and archiving a habit stops
 * it counting from that day on.
 *
 * A day is *perfect* when it has at least one active habit and every active
 * habit is COMPLETED. Streaks count consecutive perfect days. Today never
 * breaks the current streak while it is still in progress.
 */

/** A stretch of days [from, to) on which a habit was archived before being restored. */
export interface HabitPause {
  from: ISODate;
  to: ISODate;
}

export interface HabitSpan {
  id: string;
  /** First day the habit counts (user-local date). */
  startDate: ISODate;
  /** Day the habit was archived, or null while active. */
  archivedOn: ISODate | null;
  /** Earlier archive-and-restore gaps; the habit does not count on those days. */
  pauses?: HabitPause[] | null;
}

export interface Cell {
  taskId: string;
  date: ISODate;
  status: StatusValue;
}

export interface DayScore {
  date: ISODate;
  active: number;
  completed: number;
  failed: number;
  missed: number;
}

export interface Rate {
  completed: number;
  slots: number;
  rate: number;
}

export interface MonthRate {
  month: string;
  rate: number;
}

export interface HabitStats {
  today: DayScore;
  currentStreak: number;
  longestStreak: number;
  perfectDays: number;
  totals: { completed: number; failed: number; missed: number; unmarked: number; checked: number };
  /** Share of marked cells that are COMPLETED. */
  lifetimeCompletion: number;
  windows: { daily: Rate; weekly: Rate; monthly: Rate; yearly: Rate };
  bestMonth: MonthRate | null;
  worstMonth: MonthRate | null;
}

export interface TaskPerformance {
  taskId: string;
  activeDays: number;
  completed: number;
  failed: number;
  missed: number;
  unmarked: number;
  rate: number;
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** True when the habit counts on `date`. */
export function isActiveOn(habit: HabitSpan, date: ISODate): boolean {
  if (date < habit.startDate) return false;
  if (habit.archivedOn !== null && date >= habit.archivedOn) return false;
  return !habit.pauses?.some((p) => date >= p.from && date < p.to);
}

/**
 * Effective start of each habit: its own start date, or the earliest day
 * the user back-filled for it, whichever is earlier.
 */
export function effectiveSpans(habits: HabitSpan[], cells: Cell[]): HabitSpan[] {
  const earliest = new Map<string, ISODate>();
  for (const c of cells) {
    const prev = earliest.get(c.taskId);
    if (!prev || c.date < prev) earliest.set(c.taskId, c.date);
  }
  return habits.map((h) => {
    const first = earliest.get(h.id);
    return first ? { ...h, startDate: minDate(h.startDate, first) } : h;
  });
}

/** Index cells as `taskId -> date -> status`. */
export function indexCells(cells: Cell[]): Map<string, Map<ISODate, StatusValue>> {
  const index = new Map<string, Map<ISODate, StatusValue>>();
  for (const c of cells) {
    let byDate = index.get(c.taskId);
    if (!byDate) {
      byDate = new Map();
      index.set(c.taskId, byDate);
    }
    byDate.set(c.date, c.status);
  }
  return index;
}

/** Score every day from the first active day up to `today`, oldest first. */
export function scoreDays(habits: HabitSpan[], cells: Cell[], today: ISODate): DayScore[] {
  const spans = effectiveSpans(habits, cells);
  if (spans.length === 0) return [];
  const first = spans.reduce((min, h) => minDate(min, h.startDate), today);
  const index = indexCells(cells);

  return dateRange(first, today).map((date) => {
    const score: DayScore = { date, active: 0, completed: 0, failed: 0, missed: 0 };
    for (const habit of spans) {
      if (!isActiveOn(habit, date)) continue;
      score.active += 1;
      const status = index.get(habit.id)?.get(date);
      if (status === "COMPLETED") score.completed += 1;
      else if (status === "FAILED") score.failed += 1;
      else if (status === "MISSED") score.missed += 1;
    }
    return score;
  });
}

export function isPerfect(day: DayScore | undefined): boolean {
  return !!day && day.active > 0 && day.completed >= day.active;
}

/** Current and longest streak from oldest-first day scores ending today. */
export function computeStreaks(days: DayScore[]): { currentStreak: number; longestStreak: number } {
  let longestStreak = 0;
  let run = 0;
  for (const day of days) {
    run = isPerfect(day) ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  let currentStreak = 0;
  let i = days.length - 1;
  // Today is still in progress: an unfinished today does not break the streak.
  if (i >= 0 && !isPerfect(days[i])) i -= 1;
  while (i >= 0 && isPerfect(days[i])) {
    currentStreak += 1;
    i -= 1;
  }
  return { currentStreak, longestStreak };
}

/**
 * Slots a day contributes to a rate. Today is still in progress, so unless
 * `countUnfinishedToday` is set only the cells already marked count: a habit
 * you simply have not got to yet must not lower this week's or this month's
 * rate, while one marked Failed still does.
 */
function slotsOf(d: DayScore, today: ISODate, countUnfinishedToday: boolean): number {
  if (!countUnfinishedToday && d.date === today) return d.completed + d.failed + d.missed;
  return d.active;
}

function windowRate(days: DayScore[], from: ISODate, today: ISODate, countUnfinishedToday = false): Rate {
  let completed = 0;
  let slots = 0;
  for (const d of days) {
    if (d.date < from) continue;
    completed += d.completed;
    slots += slotsOf(d, today, countUnfinishedToday);
  }
  return { completed, slots, rate: percent(completed, slots) };
}

function monthExtremes(days: DayScore[], today: ISODate): { best: MonthRate | null; worst: MonthRate | null } {
  const months = new Map<string, { completed: number; slots: number }>();
  for (const d of days) {
    const slots = slotsOf(d, today, false);
    if (slots === 0) continue;
    const key = monthKey(d.date);
    const m = months.get(key) ?? { completed: 0, slots: 0 };
    m.completed += d.completed;
    m.slots += slots;
    months.set(key, m);
  }
  let best: MonthRate | null = null;
  let worst: MonthRate | null = null;
  for (const [month, m] of months) {
    const rate = percent(m.completed, m.slots);
    if (!best || rate > best.rate) best = { month, rate };
    if (!worst || rate < worst.rate) worst = { month, rate };
  }
  return { best, worst };
}

/** All headline statistics for a user. */
export function computeHabitStats(habits: HabitSpan[], cells: Cell[], today: ISODate): HabitStats {
  const days = scoreDays(habits, cells, today);
  const { currentStreak, longestStreak } = computeStreaks(days);

  let completed = 0;
  let failed = 0;
  let missed = 0;
  let slots = 0;
  let perfectDays = 0;
  for (const d of days) {
    completed += d.completed;
    failed += d.failed;
    missed += d.missed;
    slots += d.active;
    if (isPerfect(d)) perfectDays += 1;
  }
  const checked = completed + failed + missed;
  const { best, worst } = monthExtremes(days, today);
  const todayScore = days.at(-1)?.date === today
    ? days.at(-1)!
    : { date: today, active: 0, completed: 0, failed: 0, missed: 0 };

  return {
    today: todayScore,
    currentStreak,
    longestStreak,
    perfectDays,
    totals: { completed, failed, missed, unmarked: slots - checked, checked },
    lifetimeCompletion: percent(completed, checked),
    windows: {
      // Today's own rate is "done out of everything due today", so it keeps the unfinished slots.
      daily: windowRate(days, today, today, true),
      weekly: windowRate(days, addDays(today, -6), today),
      monthly: windowRate(days, addDays(today, -29), today),
      yearly: windowRate(days, addDays(today, -364), today),
    },
    bestMonth: best,
    worstMonth: worst,
  };
}

/** Daily completion for the last `count` days (oldest first), for charts and heatmaps. */
export function dailySeries(
  habits: HabitSpan[],
  cells: Cell[],
  today: ISODate,
  count: number
): { date: ISODate; completed: number; active: number; rate: number }[] {
  const scored = new Map(scoreDays(habits, cells, today).map((d) => [d.date, d]));
  return dateRange(addDays(today, -(count - 1)), today).map((date) => {
    const d = scored.get(date);
    const completed = d?.completed ?? 0;
    const active = d?.active ?? 0;
    return { date, completed, active, rate: percent(completed, active) };
  });
}

/** Per-habit performance over each habit's own active days. */
export function computeTaskPerformance(
  habits: HabitSpan[],
  cells: Cell[],
  today: ISODate
): TaskPerformance[] {
  const spans = effectiveSpans(habits, cells);
  const index = indexCells(cells);
  return spans.map((habit) => {
    const perf: TaskPerformance = {
      taskId: habit.id,
      activeDays: 0,
      completed: 0,
      failed: 0,
      missed: 0,
      unmarked: 0,
      rate: 0,
    };
    if (habit.startDate > today) return perf;
    const statuses = index.get(habit.id);
    for (const date of dateRange(habit.startDate, today)) {
      if (!isActiveOn(habit, date)) continue;
      perf.activeDays += 1;
      const status = statuses?.get(date);
      if (status === "COMPLETED") perf.completed += 1;
      else if (status === "FAILED") perf.failed += 1;
      else if (status === "MISSED") perf.missed += 1;
      else perf.unmarked += 1;
    }
    perf.rate = percent(perf.completed, perf.activeDays);
    return perf;
  });
}
