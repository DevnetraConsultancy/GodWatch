import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { pushConfigured, sendPushToUser } from "@/server/push";
import { formatTime, minutesOf, windowFor } from "@/lib/schedule";
import { asWeekTimes } from "@/server/data";
import { DEFAULT_TIME_ZONE, dateInZone, isValidTimeZone, type ISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** How far back a start time still counts, to absorb scheduler jitter. */
const WINDOW_MINUTES = 10;

function localClock(timeZone: string): { date: ISODate; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const [h = 0, m = 0] = parts.split(":").map(Number);
  return { date: dateInZone(new Date(), timeZone), minutes: h * 60 + m };
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

  let sent = 0;
  for (const user of users) {
    const zone = user.settings?.timeZone && isValidTimeZone(user.settings.timeZone) ? user.settings.timeZone : DEFAULT_TIME_ZONE;
    const { date, minutes } = localClock(zone);

    for (const task of user.tasks) {
      const window = windowFor(asWeekTimes(task.times), date);
      if (!window) continue;
      const start = minutesOf(window.start);
      if (minutes < start || minutes - start >= WINDOW_MINUTES) continue;

      // The start time is part of the key, so editing a habit's time re-arms
      // the alert for the new start even on the same day.
      const key = `${task.id}:${date}:${window.start}`;
      const marked = await prisma.taskStatus.findFirst({
        where: { taskId: task.id, date, NOT: { status: "PENDING" } },
        select: { id: true },
      });
      if (marked) continue;
      // First writer wins; a second ping in the same window hits the primary key.
      const fresh = await prisma.sentPush
        .create({ data: { key } })
        .then(() => true)
        .catch(() => false);
      if (!fresh) continue;

      sent += await sendPushToUser(user.id, {
        title: `${task.name} - ${formatTime(window.start)}`,
        body: `Time to start. Runs until ${formatTime(window.end)}.`,
        url: "/dashboard",
      });
    }
  }

  // Keep the dedupe table small.
  await prisma.sentPush.deleteMany({ where: { sentAt: { lt: new Date(Date.now() - 48 * 3600 * 1000) } } });
  return NextResponse.json({ ok: true, sent });
}
