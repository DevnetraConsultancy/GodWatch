import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { pushConfigured, sendPushToUser } from "@/server/push";
import { formatTime, minutesOf, windowFor } from "@/lib/schedule";
import { asWeekTimes } from "@/server/data";
import { DEFAULT_TIME_ZONE, addDays, dateInZone, isValidTimeZone, type ISODate } from "@/lib/dates";
import type { TimeWindow } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/** How far back a start time still counts, to absorb scheduler jitter. */
const WINDOW_MINUTES = 10;

/** Local date and minute-of-day of one instant, read from the same `now` so they cannot straddle midnight. */
function localClock(timeZone: string, now: Date): { date: ISODate; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const [h = 0, m = 0] = parts.split(":").map(Number);
  return { date: dateInZone(now, timeZone), minutes: h * 60 + m };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Habit-start notifier, pinged every few minutes by an external scheduler.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  if (!secret || expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pushConfigured) return NextResponse.json({ ok: false, reason: "push not configured" });

  // Only users with at least one registered device and at least one timed habit.
  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} }, tasks: { some: { archivedOn: null, times: { not: Prisma.DbNull } } } },
    select: {
      id: true,
      settings: { select: { timeZone: true } },
      tasks: {
        where: { archivedOn: null, times: { not: Prisma.DbNull } },
        select: { id: true, name: true, times: true },
      },
    },
  });

  const now = new Date();
  let sent = 0;
  for (const user of users) {
    const zone = user.settings?.timeZone && isValidTimeZone(user.settings.timeZone) ? user.settings.timeZone : DEFAULT_TIME_ZONE;
    const { date, minutes } = localClock(zone, now);
    const yesterday = addDays(date, -1);

    for (const task of user.tasks) {
      const times = asWeekTimes(task.times);
      // A start in the last minutes before midnight is only seen by the first
      // tick after it, which already belongs to the next day, so yesterday's
      // window is checked too, shifted by a day.
      const due: { date: ISODate; window: TimeWindow }[] = [];
      for (const [day, offset] of [
        [date, 0],
        [yesterday, 24 * 60],
      ] as const) {
        const window = windowFor(times, day);
        if (!window) continue;
        const elapsed = minutes + offset - minutesOf(window.start);
        if (elapsed >= 0 && elapsed < WINDOW_MINUTES) due.push({ date: day, window });
      }

      for (const { date: day, window } of due) {
        const marked = await prisma.taskStatus.findFirst({
          where: { taskId: task.id, date: day, NOT: { status: "PENDING" } },
          select: { id: true },
        });
        if (marked) continue;

        // The start time is part of the key, so editing a habit's time re-arms
        // the alert for the new start even on the same day. First writer wins;
        // a second ping in the same window hits the primary key.
        const key = `${task.id}:${day}:${window.start}`;
        try {
          await prisma.sentPush.create({ data: { key } });
        } catch (error) {
          if (!isUniqueViolation(error)) console.error("[push-cron] could not record alert", { key, error });
          continue;
        }

        try {
          sent += await sendPushToUser(user.id, {
            title: `${task.name} - ${formatTime(window.start)}`,
            body: `Time to start. Runs until ${formatTime(window.end)}.`,
            url: "/dashboard",
          });
        } catch (error) {
          // Release the key so the next tick inside the window retries.
          console.error("[push-cron] send failed", { key, error });
          await prisma.sentPush.delete({ where: { key } }).catch(() => undefined);
        }
      }
    }
  }

  // Keep the dedupe table small.
  await prisma.sentPush.deleteMany({ where: { sentAt: { lt: new Date(Date.now() - 48 * 3600 * 1000) } } });
  return NextResponse.json({ ok: true, sent });
}
