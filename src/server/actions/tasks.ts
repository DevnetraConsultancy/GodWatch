"use server";

import { prisma } from "@/server/db";
import { logActivity } from "@/server/activity";
import { runAction, UserFacingError } from "@/server/actions/run";
import { MAX_ACTIVE_TASKS } from "@/lib/constants";
import {
  taskCreateSchema,
  taskDeleteSchema,
  taskReorderSchema,
  taskUpdateSchema,
} from "@/lib/validation";
import type { ActionResult, TaskDTO } from "@/types/dto";

const taskSelect = { id: true, name: true, color: true, order: true, startDate: true, archivedOn: true } as const;

async function findOwnedTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new UserFacingError("That habit no longer exists.");
  return task;
}

export async function createTask(input: unknown): Promise<ActionResult<TaskDTO>> {
  return runAction({ name: "createTask", bucket: "write", schema: taskCreateSchema }, input, async (data, user) => {
    const activeCount = await prisma.task.count({ where: { userId: user.id, archivedOn: null } });
    if (activeCount >= MAX_ACTIVE_TASKS) {
      throw new UserFacingError(`You can track up to ${MAX_ACTIVE_TASKS} active habits. Archive one to add another.`);
    }
    const last = await prisma.task.aggregate({ where: { userId: user.id }, _max: { order: true } });
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        name: data.name,
        color: data.color ?? user.settings.defaultTaskColor,
        order: (last._max.order ?? -1) + 1,
        startDate: user.today,
      },
      select: taskSelect,
    });
    await logActivity(user.id, "TASK_CREATED", { taskId: task.id, name: task.name });
    return task;
  });
}

export async function updateTask(input: unknown): Promise<ActionResult<TaskDTO>> {
  return runAction({ name: "updateTask", bucket: "write", schema: taskUpdateSchema }, input, async (data, user) => {
    const existing = await findOwnedTask(user.id, data.taskId);
    const archivedOn =
      data.archived === undefined ? undefined : data.archived ? (existing.archivedOn ?? user.today) : null;

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: { name: data.name, color: data.color, archivedOn },
      select: taskSelect,
    });

    if (data.name !== undefined && data.name !== existing.name) {
      await logActivity(user.id, "TASK_RENAMED", { taskId: task.id, from: existing.name, to: task.name });
    }
    if (data.color !== undefined && data.color !== existing.color) {
      await logActivity(user.id, "TASK_COLOR_CHANGED", { taskId: task.id, name: task.name, to: task.color });
    }
    if (archivedOn !== undefined && (archivedOn === null) !== (existing.archivedOn === null)) {
      await logActivity(user.id, archivedOn ? "TASK_ARCHIVED" : "TASK_UNARCHIVED", { taskId: task.id, name: task.name });
    }
    return task;
  });
}

export async function deleteTask(input: unknown): Promise<ActionResult> {
  return runAction({ name: "deleteTask", bucket: "write", schema: taskDeleteSchema }, input, async (data, user) => {
    const existing = await findOwnedTask(user.id, data.taskId);
    await prisma.task.delete({ where: { id: existing.id } });
    await logActivity(user.id, "TASK_DELETED", { taskId: existing.id, name: existing.name });
    return undefined;
  });
}

export async function reorderTasks(input: unknown): Promise<ActionResult> {
  return runAction({ name: "reorderTasks", bucket: "write", schema: taskReorderSchema }, input, async (data, user) => {
    const owned = await prisma.task.findMany({ where: { userId: user.id, archivedOn: null }, select: { id: true } });
    const ownedIds = new Set(owned.map((t) => t.id));
    const ordered = [...new Set(data.orderedIds)].filter((id) => ownedIds.has(id));
    // Any active habit missing from the request keeps its place at the end.
    for (const t of owned) if (!ordered.includes(t.id)) ordered.push(t.id);

    await prisma.$transaction(
      ordered.map((id, order) => prisma.task.update({ where: { id }, data: { order } }))
    );
    await logActivity(user.id, "TASK_REORDERED", { count: ordered.length });
    return undefined;
  });
}
