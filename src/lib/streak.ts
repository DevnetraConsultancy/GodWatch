/**
 * Streak computation utilities.
 *
 * A "day counts toward the streak" when every active task for that day is
 * COMPLETED (a perfect day). The current streak is allowed to be "alive"
 * today even if today is not yet complete — matching the common habit-tracker
 * behavior (your streak isn't broken until the day ends incomplete).
 */

export interface DayCompletion {
  date: string; // yyyy-MM-dd
  completed: number;
  total: number;
}

/** True if the given day was a perfect (fully completed) day. */
export function isPerfectDay(day: DayCompletion | undefined): boolean {
  if (!day) return false;
  if (day.total <= 0) return false;
  return day.completed >= day.total;
}

/**
 * Compute current + longest streaks from a map of ISO dates → day completion.
 *
 * @param dayMap       ISO date → completion info for days that have data.
 * @param today        Today's ISO date (defaults to system date).
 */
export function computeStreaks(
  dayMap: Map<string, DayCompletion>,
  today = new Date().toISOString().slice(0, 10)
): { currentStreak: number; longestStreak: number } {
  const sortedDates = [...dayMap.keys()].sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Compute longest streak by scanning consecutive perfect days.
  let longestStreak = 0;
  let running = 0;
  let prevDate: string | null = null;

  for (const date of sortedDates) {
    const day = dayMap.get(date);
    const perfect = isPerfectDay(day);

    if (perfect) {
      if (prevDate && isConsecutiveDay(prevDate, date)) {
        running += 1;
      } else {
        running = 1;
      }
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
    prevDate = date;
  }

  // Compute current streak. It counts consecutive perfect days ending today
  // (or ending yesterday — today is still "in progress").
  let currentStreak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);

  // If today is not perfect, check from yesterday backwards.
  if (!isPerfectDay(dayMap.get(today))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const cursorISO = cursor.toISOString().slice(0, 10);
  const hasData = dayMap.has(cursorISO);

  // If today/yesterday has no data at all, streak is 0.
  if (!hasData) {
    return { currentStreak: 0, longestStreak };
  }

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    const day = dayMap.get(iso);
    if (!isPerfectDay(day)) break;
    currentStreak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    // Stop if we've gone before any data exists.
    if (cursor.toISOString().slice(0, 10) < sortedDates[0]!) break;
  }

  return { currentStreak, longestStreak };
}

/** True if b is the day immediately after a (yyyy-MM-dd). */
export function isConsecutiveDay(a: string, b: string): boolean {
  const da = new Date(`${a}T00:00:00Z`);
  const db = new Date(`${b}T00:00:00Z`);
  const diff = (db.getTime() - da.getTime()) / 86_400_000;
  return diff === 1;
}

