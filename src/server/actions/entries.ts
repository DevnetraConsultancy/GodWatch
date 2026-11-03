"use server";

import { prisma } from "@/server/db";
import { logActivity } from "@/server/activity";
import { unlockAchievements } from "@/server/achievements";
import { runAction, UserFacingError } from "@/server/actions/run";
import { addDays } from "@/lib/dates";
import { MAX_HISTORY_DAYS } from "@/lib/constants";
import { isoDateSchema, noteUpdateSchema, statusUpdateSchema } from "@/lib/validation";
import type { ActionResult, UnlockedAchievement } from "@/types/dto";
import type { ISODate } from "@/lib/dates";
import { z } from "zod";

function assertRecordableDate(date: ISODate, today: ISODate): void {
  if (date > today) throw new UserFacingError("You can't record a day that hasn't happened yet.");
  if (date < addDays(today, -MAX_HISTORY_DAYS)) throw new UserFacingError("That day is too far in the past.");
}

/** Set one cell. PENDING clears the cell. Returns any badges this unlocked. */
export async function setStatus(input: unknown): Promise<ActionResult<{ unlocked: UnlockedAchievement[] }>> {
  return runAction({ name: "setStatus", bucket: "status", schema: statusUpdateSchema }, input, async (data, user) => {
    assertRecordableDate(data.date, user.today);
    const task = await prisma.task.findFirst({
      where: { id: data.taskId, userId: user.id },
      select: { id: true, name: true, archivedOn: true },
    });
    if (!task) throw new UserFacingError("That habit no longer exists.");
    if (task.archivedOn) throw new UserFacingError("Restore this habit before changing it.");

    const where = { taskId_date: { taskId: task.id, date: data.date } };
    const previous = await prisma.taskStatus.findUnique({ where, select: { status: true } });

    if (data.status === "PENDING") {
      await prisma.taskStatus.deleteMany({ where: { taskId: task.id, date: data.date } });
    } else {
      await prisma.taskStatus.upsert({
        where,
        update: { status: data.status },
        create: { taskId: task.id, date: data.date, status: data.status },
      });
    }

    await logActivity(user.id, "STATUS_CHANGED", {
      taskId: task.id,
      name: task.name,
      date: data.date,
      from: previous?.status ?? "PENDING",
      to: data.status,
    });

    const unlocked = data.status === "COMPLETED" ? await unlockAchievements(user.id, user.today) : [];
    return { unlocked };
  });
}

export async function getNote(input: unknown): Promise<ActionResult<{ content: string }>> {
  return runAction({ name: "getNote", bucket: "note", schema: z.object({ date: isoDateSchema }) }, input, async (data, user) => {
    const note = await prisma.note.findUnique({
      where: { userId_date: { userId: user.id, date: data.date } },
      select: { content: true },
    });
    return { content: note?.content ?? "" };
  });
}

/** Autosave a day's note. An empty note is removed. */
export async function saveNote(input: unknown): Promise<ActionResult<{ hasNote: boolean }>> {
  return runAction({ name: "saveNote", bucket: "note", schema: noteUpdateSchema }, input, async (data, user) => {
    assertRecordableDate(data.date, user.today);
    const key = { userId_date: { userId: user.id, date: data.date } };
    if (data.content.trim() === "") {
      await prisma.note.deleteMany({ where: { userId: user.id, date: data.date } });
      return { hasNote: false };
    }
    const existing = await prisma.note.findUnique({ where: key, select: { id: true } });
    await prisma.note.upsert({
      where: key,
      update: { content: data.content },
      create: { userId: user.id, date: data.date, content: data.content },
    });
    // Log the first save of a day's note, not every autosave keystroke batch.
    if (!existing) await logActivity(user.id, "NOTE_UPDATED", { date: data.date });
    return { hasNote: true };
  });
}
