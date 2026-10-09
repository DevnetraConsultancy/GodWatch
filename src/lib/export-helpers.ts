import type { TaskDTO } from "@/types";

/**
 * Helpers for exporting God Watch data to CSV / PDF.
 * Kept framework-agnostic so they can be used in server actions or clients.
 */

export interface ExportRow {
  task: string;
  date: string;
  status: string;
}

/** Build a flat list of task/date/status rows. */
export function buildExportRows(
  tasks: TaskDTO[],
  statuses: Record<string, Record<string, string>>,
  dates: string[]
): ExportRow[] {
  const rows: ExportRow[] = [];
  for (const date of dates) {
    for (const task of tasks) {
      rows.push({
        task: task.name,
        date,
        status: statuses[task.id]?.[date] ?? "PENDING",
      });
    }
  }
  return rows;
}

/** Escape a field for CSV. */
export function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serialize rows to a CSV string with a header row. */
export function toCSV(rows: ExportRow[]): string {
  const header = ["Task", "Date", "Status"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push([csvEscape(row.task), csvEscape(row.date), csvEscape(row.status)].join(","));
  }
  return lines.join("\n");
}

/** Status label map for export files. */
export const STATUS_LABELS_EXPORT: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  MISSED: "Missed",
};

