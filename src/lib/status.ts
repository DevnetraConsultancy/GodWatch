/** The four states of a grid cell. */
export const STATUSES = ["PENDING", "COMPLETED", "FAILED", "MISSED"] as const;

export type StatusValue = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<StatusValue, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  MISSED: "Missed",
};

/** Short encouragement shown after a status change. */
export const STATUS_MESSAGES: Record<StatusValue, string> = {
  COMPLETED: "Another day of evidence. Keep going.",
  FAILED: "A miss is a lesson. Tomorrow is a fresh start.",
  MISSED: "Life happens. Get back to it tomorrow.",
  PENDING: "Back to pending. No pressure, just show up.",
};

/** Next status when a cell is clicked: Pending, Completed, Failed, Missed, Pending... */
export function nextStatus(current: StatusValue): StatusValue {
  const i = STATUSES.indexOf(current);
  return STATUSES[(i + 1) % STATUSES.length]!;
}

export function isStatus(value: unknown): value is StatusValue {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}
