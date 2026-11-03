import { addDays, dateRange, type ISODate } from "@/lib/dates";
import { effectiveSpans, indexCells, isActiveOn, type Cell, type HabitSpan } from "@/lib/stats";
import { STATUS_LABELS } from "@/lib/status";

/** One line of an export: a habit on a day it was active. */
export interface ExportRow {
  date: ISODate;
  task: string;
  status: string;
}

export const EXPORT_DAYS = 365;

/** Rows for the last `days` days, newest first, only where the habit was active. */
export function buildExportRows(
  habits: (HabitSpan & { name: string })[],
  cells: Cell[],
  today: ISODate,
  days = EXPORT_DAYS
): ExportRow[] {
  const spans = effectiveSpans(habits, cells);
  const index = indexCells(cells);
  const rows: ExportRow[] = [];
  for (const date of dateRange(addDays(today, -(days - 1)), today).reverse()) {
    spans.forEach((habit, i) => {
      if (!isActiveOn(habit, date)) return;
      const status = index.get(habit.id)?.get(date) ?? "PENDING";
      rows.push({ date, task: habits[i]!.name, status: STATUS_LABELS[status] });
    });
  }
  return rows;
}

/**
 * Escape one CSV field. Values that a spreadsheet would run as a formula
 * (starting with = + - @ tab or CR) are prefixed with a quote.
 */
export function csvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCSV(rows: ExportRow[]): string {
  const lines = ["Date,Task,Status"];
  for (const r of rows) lines.push([r.date, r.task, r.status].map(csvField).join(","));
  return `${lines.join("\r\n")}\r\n`;
}
