import type { ISODate } from "@/lib/dates";

/** One daily time window, 24h "HH:mm" strings. */
export interface TimeWindow {
  start: string;
  end: string;
}

export type WeekdayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";

/** Per-weekday windows, keyed "0" (Sunday) to "6" (Saturday). Absent day = untimed. */
export type WeekTimes = Partial<Record<WeekdayKey, TimeWindow>>;

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
  "0": "Sunday",
};

/** Monday-first order for editing UIs. */
export const WEEKDAY_ORDER: WeekdayKey[] = ["1", "2", "3", "4", "5", "6", "0"];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function minutesOf(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Weekday (0 Sunday .. 6 Saturday) of a yyyy-MM-dd calendar date. */
export function weekdayOf(date: ISODate): WeekdayKey {
  return String(new Date(`${date}T00:00:00Z`).getUTCDay()) as WeekdayKey;
}

export function windowFor(times: WeekTimes | null | undefined, date: ISODate): TimeWindow | null {
  return times?.[weekdayOf(date)] ?? null;
}

/** "09:00" -> "9 AM", "21:30" -> "9:30 PM". */
export function formatTime(time: string): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatWindow(window: TimeWindow): string {
  return `${formatTime(window.start)} - ${formatTime(window.end)}`;
}

/**
 * Suggested start for a habit's window on one weekday: the end of the
 * closest earlier habit (by column order) that has a window that day.
 * "Running ends at 8 PM, so the next habit starts at 8 PM."
 */
export function suggestedStart(
  earlierTimes: (WeekTimes | null | undefined)[],
  weekday: WeekdayKey
): string | null {
  for (let i = earlierTimes.length - 1; i >= 0; i--) {
    const window = earlierTimes[i]?.[weekday];
    if (window) return window.end;
  }
  return null;
}
