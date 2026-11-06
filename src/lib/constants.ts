/** Brand and product constants. */

export const APP_NAME = "God Watch";
export const APP_TAGLINE = "Every Day Leaves Evidence.";
export const APP_DESCRIPTION =
  "A date-first habit tracker and daily checklist. Record whether each task was completed, failed, or missed, and build consistency through streaks and analytics.";
export const APP_FOOTER_COMPANY = "Devnetra Consultancy";
export const APP_CONTACT_EMAIL = "devnetraconsultancy@gmail.com";

/** Days shown in the grid before "Show earlier days". */
export const GRID_PAGE_DAYS = 90;
/** Furthest back a status can be recorded. */
export const MAX_HISTORY_DAYS = 3650;
export const MAX_ACTIVE_TASKS = 50;

/** Habit colour palette. */
export const TASK_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#84cc16",
  "#f97316",
  "#64748b",
] as const;

export type TaskColor = (typeof TASK_COLORS)[number];
export const DEFAULT_TASK_COLOR: TaskColor = "#6366f1";

export const TASK_COLOR_NAMES: Record<TaskColor, string> = {
  "#6366f1": "Indigo",
  "#8b5cf6": "Violet",
  "#ec4899": "Pink",
  "#ef4444": "Red",
  "#f59e0b": "Amber",
  "#10b981": "Emerald",
  "#06b6d4": "Cyan",
  "#3b82f6": "Blue",
  "#84cc16": "Lime",
  "#f97316": "Orange",
  "#64748b": "Slate",
};
