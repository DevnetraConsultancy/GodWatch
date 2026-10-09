import { z } from "zod";
import { TASK_COLORS } from "@/lib/constants";

/**
 * Centralized Zod validation schemas for God Watch.
 * Used by both server actions and client components.
 */

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in yyyy-MM-dd format")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return false;
    // Reject rolled-over dates like 2024-13-45.
    return d.toISOString().slice(0, 10) === v;
  }, "Invalid date");

export { isoDateSchema };

const statusSchema = z.enum(["PENDING", "COMPLETED", "FAILED", "MISSED"]);

const taskNameSchema = z
  .string()
  .trim()
  .min(1, "Task name is required")
  .max(100, "Task name must be 100 characters or fewer");

const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Invalid color")
  .refine((c) => TASK_COLORS.includes(c as (typeof TASK_COLORS)[number]), {
    message: "Color must be from the allowed palette",
  });

/** Create a task. */
export const taskCreateSchema = z.object({
  name: taskNameSchema,
  color: colorSchema.default("#6366f1"),
});

/** Update a task (rename, recolor, archive). */
export const taskUpdateSchema = z
  .object({
    name: taskNameSchema.optional(),
    color: colorSchema.optional(),
    archived: z.boolean().optional(),
  })
  .refine((d) => d.name !== undefined || d.color !== undefined || d.archived !== undefined, {
    message: "At least one field must be provided",
  });

/** Update a cell's status. */
export const statusUpdateSchema = z.object({
  taskId: z.string().min(1),
  date: isoDateSchema,
  status: statusSchema,
});

/** Save a date note. */
export const noteUpdateSchema = z.object({
  date: isoDateSchema,
  content: z.string().max(10_000, "Note is too long"),
});

/** Reorder tasks via drag & drop. */
export const taskReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "At least one task is required"),
});

/** Update user settings. */
export const settingsUpdateSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  dailyReminderEnabled: z.boolean().default(false),
  dailyReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm (24-hour)")
    .nullable()
    .optional(),
  dailyReminderChannel: z.enum(["browser", "email"]).default("browser"),
  defaultTaskColor: colorSchema.default("#6366f1"),
});

/** Search query. */
export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
});

/** Export format. */
export const exportFormatSchema = z.enum(["csv", "pdf"]);

/** Activity log entry. */
export const activityLogSchema = z.object({
  type: z.enum([
    "TASK_CREATED",
    "TASK_RENAMED",
    "TASK_DELETED",
    "TASK_ARCHIVED",
    "TASK_UNARCHIVED",
    "TASK_REORDERED",
    "TASK_COLOR_CHANGED",
    "STATUS_CHANGED",
    "LOGIN",
    "LOGOUT",
    "SETTINGS_CHANGED",
    "NOTE_UPDATED",
    "ACHIEVEMENT_UNLOCKED",
  ]),
  metadata: z.record(z.unknown()).optional(),
});

