"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { requireUserId } from "@/lib/queries";
import {
  noteUpdateSchema,
  settingsUpdateSchema,
  statusUpdateSchema,
  taskCreateSchema,
  taskReorderSchema,
  taskUpdateSchema,
} from "@/lib/validation";
import type { Status } from "@prisma/client";

/**
 * Server actions for God Watch.
 * All actions:
 *   - Verify the authenticated user (authorization)
 *   - Validate payloads with Zod (input validation)
 *   - Scope all queries to the session user (isolation)
 *   - Revalidate the dashboard cache
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
  data?: unknown;
}

/** Create a new task. */
export async function createTask(
  input: unknown
): Promise<ActionResult> {
  try {
    const parsed = taskCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const userId = await requireUserId();

    // Compute next order value
    const lastTask = await prisma.task.findFirst({
      where: { userId, archived: false },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = (lastTask?.order ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        userId,
        name: parsed.data.name,
        color: parsed.data.color,
        order,
      },
    });

    await logActivity({ userId, type: "TASK_CREATED", metadata: { taskId: task.id, name: task.name } });
    revalidatePath("/");
    return { ok: true, data: task };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[createTask]", msg, error);
    return { ok: false, message: `Failed to create task: ${msg}` };
  }
}

/** Update a task (rename, color, archive). */
export async function updateTask(
  taskId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    const parsed = taskUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message };
    }
    const userId = await requireUserId();

    // Authorization: task must belong to user
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!existing) return { ok: false, message: "Task not found" };

    const task = await prisma.task.update({
      where: { id: taskId },
      data: parsed.data,
    });

    if (parsed.data.name && parsed.data.name !== existing.name) {
      await logActivity({
        userId,
        type: "TASK_RENAMED",
        metadata: { taskId, from: existing.name, to: parsed.data.name },
      });
    }
    if (typeof parsed.data.archived === "boolean" && parsed.data.archived !== existing.archived) {
      await logActivity({
        userId,
        type: parsed.data.archived ? "TASK_ARCHIVED" : "TASK_UNARCHIVED",
        metadata: { taskId, name: task.name },
      });
    }
    if (parsed.data.color && parsed.data.color !== existing.color) {
      await logActivity({
        userId,
        type: "TASK_COLOR_CHANGED",
        metadata: { taskId, from: existing.color, to: parsed.data.color },
      });
    }

    revalidatePath("/");
    return { ok: true, data: task };
  } catch (error) {
    console.error("[updateTask]", error);
    return { ok: false, message: "Failed to update task" };
  }
}

/** Delete a task. */
export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!existing) return { ok: false, message: "Task not found" };

    await prisma.task.delete({ where: { id: taskId } });
    await logActivity({
      userId,
      type: "TASK_DELETED",
      metadata: { taskId, name: existing.name },
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("[deleteTask]", error);
    return { ok: false, message: "Failed to delete task" };
  }
}

/** Reorder tasks (drag & drop). */
export async function reorderTasks(input: unknown): Promise<ActionResult> {
  try {
    const parsed = taskReorderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Invalid order" };
    const userId = await requireUserId();

    const tasks = await prisma.task.findMany({
      where: { userId, archived: false },
      select: { id: true },
    });
    const owned = new Set(tasks.map((t) => t.id));
    const validIds = parsed.data.orderedIds.filter((id) => owned.has(id));

    await prisma.$transaction(
      validIds.map((id, index) =>
        prisma.task.update({ where: { id }, data: { order: index } })
      )
    );
    await logActivity({
      userId,
      type: "TASK_REORDERED",
      metadata: { orderedIds: validIds },
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("[reorderTasks]", error);
    return { ok: false, message: "Failed to reorder tasks" };
  }
}

/** Update a cell's status. */
export async function updateStatus(
  input: unknown
): Promise<ActionResult> {
  try {
    const parsed = statusUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Invalid status payload" };
    const userId = await requireUserId();

    // Authorization: task must belong to user
    const task = await prisma.task.findFirst({
      where: { id: parsed.data.taskId, userId },
      select: { id: true },
    });
    if (!task) return { ok: false, message: "Task not found" };

    const status = parsed.data.status as Status;
    const existing = await prisma.taskStatus.findUnique({
      where: {
        taskId_date: { taskId: parsed.data.taskId, date: parsed.data.date },
      },
    });

    const cell = existing
      ? await prisma.taskStatus.update({
          where: { id: existing.id },
          data: { status },
        })
      : await prisma.taskStatus.create({
          data: {
            taskId: parsed.data.taskId,
            date: parsed.data.date,
            status,
          },
        });

    await logActivity({
      userId,
      type: "STATUS_CHANGED",
      metadata: {
        taskId: parsed.data.taskId,
        date: parsed.data.date,
        from: existing?.status ?? "PENDING",
        to: status,
      },
    });

    revalidatePath("/");
    return { ok: true, data: cell };
  } catch (error) {
    console.error("[updateStatus]", error);
    return { ok: false, message: "Failed to update status" };
  }
}

/** Save a note with autosave semantics (upsert). */
export async function saveNote(input: unknown): Promise<ActionResult> {
  try {
    const parsed = noteUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Invalid note payload" };
    const userId = await requireUserId();

    const note = await prisma.note.upsert({
      where: { userId_date: { userId, date: parsed.data.date } },
      update: { content: parsed.data.content },
      create: { userId, date: parsed.data.date, content: parsed.data.content },
    });

    await logActivity({
      userId,
      type: "NOTE_UPDATED",
      metadata: { noteId: note.id, date: parsed.data.date },
    });
    revalidatePath("/");
    return { ok: true, data: note };
  } catch (error) {
    console.error("[saveNote]", error);
    return { ok: false, message: "Failed to save note" };
  }
}

/** Update user settings. */
export async function updateSettings(input: unknown): Promise<ActionResult> {
  try {
    const parsed = settingsUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Invalid settings payload" };
    const userId = await requireUserId();

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: parsed.data,
      create: { userId, ...parsed.data },
    });

    await logActivity({
      userId,
      type: "SETTINGS_CHANGED",
      metadata: { changed: Object.keys(parsed.data) },
    });
    revalidatePath("/");
    return { ok: true, data: settings };
  } catch (error) {
    console.error("[updateSettings]", error);
    return { ok: false, message: "Failed to update settings" };
  }
}

