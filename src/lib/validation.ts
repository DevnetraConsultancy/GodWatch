import { z } from "zod";
import { TASK_COLORS, type TaskColor } from "@/lib/constants";
import { isISODate, isValidTimeZone } from "@/lib/dates";
import { minutesOf } from "@/lib/schedule";
import { STATUSES } from "@/lib/status";

/**
 * Validation schemas shared by forms (client) and server actions (server).
 * The server always re-validates; client checks are only for fast feedback.
 */

export const idSchema = z.string().trim().min(1).max(64).regex(/^[a-z0-9]+$/i, "Invalid id");

export const isoDateSchema = z.string().refine(isISODate, "Invalid date");

export const statusSchema = z.enum(STATUSES);

export const timeZoneSchema = z.string().refine(isValidTimeZone, "Unknown timezone");

export const taskNameSchema = z
  .string()
  .trim()
  .min(1, "Give the habit a name")
  .max(100, "Keep the name to 100 characters or fewer");

export const colorSchema = z
  .string()
  .refine((c): c is TaskColor => (TASK_COLORS as readonly string[]).includes(c), "Pick a colour from the palette");

export const taskCreateSchema = z.object({
  name: taskNameSchema,
  color: colorSchema.optional(),
});

export const clockTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm (24-hour)");

const timeWindowSchema = z
  .object({ start: clockTimeSchema, end: clockTimeSchema })
  .refine((w) => minutesOf(w.end) > minutesOf(w.start), { message: "End must be after start" });

/** Per-weekday windows keyed "0" (Sunday) to "6" (Saturday); null (or no days) clears all times. */
export const weekTimesSchema = z
  .partialRecord(z.enum(["0", "1", "2", "3", "4", "5", "6"]), timeWindowSchema)
  .nullable()
  // An empty object is "untimed": store null so the cron's `times IS NOT NULL`
  // filter never picks up windowless habits.
  .transform((v) => (v && Object.keys(v).length > 0 ? v : null));

export const taskUpdateSchema = z
  .object({
    taskId: idSchema,
    name: taskNameSchema.optional(),
    color: colorSchema.optional(),
    archived: z.boolean().optional(),
    times: weekTimesSchema.optional(),
  })
  .refine(
    (d) => d.name !== undefined || d.color !== undefined || d.archived !== undefined || d.times !== undefined,
    { message: "Nothing to update" }
  );

export const taskDeleteSchema = z.object({ taskId: idSchema });

export const taskReorderSchema = z.object({
  orderedIds: z.array(idSchema).min(1).max(200),
});

export const statusUpdateSchema = z.object({
  taskId: idSchema,
  date: isoDateSchema,
  status: statusSchema,
});

export const noteUpdateSchema = z.object({
  date: isoDateSchema,
  content: z.string().max(10_000, "Notes are limited to 10,000 characters"),
});

export const reminderTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm (24-hour)");

export const settingsUpdateSchema = z.object({
  dailyReminderEnabled: z.boolean(),
  dailyReminderTime: reminderTimeSchema,
  defaultTaskColor: colorSchema,
});

export const searchQuerySchema = z.string().trim().min(1).max(100);

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

/** First human-readable message from a failed parse. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
