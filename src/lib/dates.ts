/**
 * Calendar-date helpers.
 *
 * A "calendar date" is a `yyyy-MM-dd` string that names a day in the user's
 * own timezone. Arithmetic on these strings is done in UTC so it never shifts
 * across daylight-saving boundaries.
 */

export type ISODate = string;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export const DEFAULT_TIME_ZONE = "UTC";

/** True for a real `yyyy-MM-dd` calendar date (rejects 2024-02-30). */
export function isISODate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** True when the runtime recognises the IANA timezone name. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date of an instant, as seen in `timeZone`. */
export function dateInZone(instant: Date, timeZone: string): ISODate {
  const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
  // en-CA formats as yyyy-MM-dd.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Today's calendar date in `timeZone`. */
export function todayInZone(timeZone: string, now: Date = new Date()): ISODate {
  return dateInZone(now, timeZone);
}

/** Shift a calendar date by whole days. */
export function addDays(date: ISODate, days: number): ISODate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: ISODate, to: ISODate): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / DAY_MS);
}

/** Inclusive list of dates from `from` to `to`, oldest first. */
export function dateRange(from: ISODate, to: ISODate): ISODate[] {
  const count = daysBetween(from, to);
  if (count < 0) return [];
  const out: ISODate[] = [];
  for (let i = 0; i <= count; i++) out.push(addDays(from, i));
  return out;
}

/** Earlier of two calendar dates. */
export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

/** `yyyy-MM` month key of a date. */
export function monthKey(date: ISODate): string {
  return date.slice(0, 7);
}

/** Format a calendar date for display without timezone drift. */
export function formatDate(
  date: ISODate,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
  locale = "en-US"
): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    ...options,
    timeZone: "UTC",
  });
}

/** Format a `yyyy-MM` month key, e.g. "March 2025". */
export function formatMonth(
  month: string,
  options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }
): string {
  return formatDate(`${month}-01`, options);
}
