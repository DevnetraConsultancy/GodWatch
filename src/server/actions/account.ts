"use server";

import { prisma } from "@/server/db";
import { logActivity } from "@/server/activity";
import { runAction } from "@/server/actions/run";
import { signIn, signOut } from "@/server/auth";
import { getCurrentUser } from "@/server/session";
import { addDays, formatDate, isISODate } from "@/lib/dates";
import { searchQuerySchema, settingsUpdateSchema, timeZoneSchema } from "@/lib/validation";
import type { ActionResult, SearchResult } from "@/types/dto";
import { z } from "zod";

export async function updateSettings(input: unknown): Promise<ActionResult> {
  return runAction({ name: "updateSettings", bucket: "write", schema: settingsUpdateSchema }, input, async (data, user) => {
    await prisma.settings.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, timeZone: user.timeZone, ...data },
    });
    await logActivity(user.id, "SETTINGS_CHANGED", { fields: Object.keys(data) });
    return undefined;
  });
}

/** Store the browser's timezone so "today" matches the user's own day. */
export async function syncTimeZone(input: unknown): Promise<ActionResult<{ changed: boolean }>> {
  const schema = z.object({ timeZone: timeZoneSchema });
  return runAction({ name: "syncTimeZone", bucket: "write", schema }, input, async (data, user) => {
    if (data.timeZone === user.timeZone) return { changed: false };
    await prisma.settings.upsert({
      where: { userId: user.id },
      update: { timeZone: data.timeZone },
      create: { userId: user.id, timeZone: data.timeZone },
    });
    return { changed: true };
  });
}

/** Search habit names, note text and dates. */
export async function search(input: unknown): Promise<ActionResult<SearchResult[]>> {
  const schema = z.object({ q: searchQuerySchema });
  return runAction({ name: "search", bucket: "search", schema }, input, async ({ q }, user) => {
    // Prisma parameterises `contains`; the query is scoped to this user's rows.
    const contains = q;
    const [tasks, notes] = await Promise.all([
      prisma.task.findMany({
        where: { userId: user.id, name: { contains, mode: "insensitive" } },
        select: { id: true, name: true, archivedOn: true },
        take: 8,
      }),
      prisma.note.findMany({
        where: { userId: user.id, content: { contains, mode: "insensitive" } },
        select: { id: true, date: true, content: true },
        orderBy: { date: "desc" },
        take: 8,
      }),
    ]);

    const results: SearchResult[] = [];
    if (isISODate(q) && q <= user.today && q >= addDays(user.today, -3650)) {
      results.push({
        kind: "date",
        id: q,
        title: formatDate(q, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
        subtitle: "Jump to this day",
        href: `/dashboard?date=${q}`,
      });
    }
    for (const t of tasks) {
      results.push({
        kind: "habit",
        id: t.id,
        title: t.name,
        subtitle: t.archivedOn ? "Archived habit" : "Habit",
        href: t.archivedOn ? "/settings#archived" : `/dashboard?habit=${t.id}`,
      });
    }
    for (const n of notes) {
      const i = n.content.toLowerCase().indexOf(q.toLowerCase());
      const start = Math.max(0, i - 30);
      const snippet = `${start > 0 ? "..." : ""}${n.content.slice(start, start + 90).replace(/\s+/g, " ")}`;
      results.push({
        kind: "note",
        id: n.id,
        title: `Note, ${formatDate(n.date, { month: "short", day: "numeric", year: "numeric" })}`,
        subtitle: snippet,
        href: `/dashboard?date=${n.date}&note=1`,
      });
    }
    return results;
  });
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const raw = formData.get("callbackUrl");
  // Same-origin paths only, to prevent open redirects.
  const redirectTo = typeof raw === "string" && /^\/(?!\/)[\w\-/?=&.]*$/.test(raw) ? raw : "/dashboard";
  await signIn("google", { redirectTo });
}

export async function signOutUser(): Promise<void> {
  const user = await getCurrentUser();
  if (user) await logActivity(user.id, "LOGOUT");
  await signOut({ redirectTo: "/" });
}
