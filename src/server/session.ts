import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { DEFAULT_TIME_ZONE, isValidTimeZone, todayInZone, type ISODate } from "@/lib/dates";
import { DEFAULT_TASK_COLOR } from "@/lib/constants";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  joinedAt: string;
  timeZone: string;
  today: ISODate;
  settings: {
    dailyReminderEnabled: boolean;
    dailyReminderTime: string;
    defaultTaskColor: string;
  };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/**
 * The signed-in user, verified against the database, or null.
 * Cached per request so layouts, pages and actions share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      settings: {
        select: { timeZone: true, dailyReminderEnabled: true, dailyReminderTime: true, defaultTaskColor: true },
      },
    },
  });
  if (!user) return null;

  const timeZone = isValidTimeZone(user.settings?.timeZone ?? "") ? user.settings!.timeZone : DEFAULT_TIME_ZONE;
  return {
    id: user.id,
    name: user.name ?? "God Watcher",
    email: user.email,
    image: user.image,
    joinedAt: user.createdAt.toISOString(),
    timeZone,
    today: todayInZone(timeZone),
    settings: {
      dailyReminderEnabled: user.settings?.dailyReminderEnabled ?? false,
      dailyReminderTime: user.settings?.dailyReminderTime ?? "20:00",
      defaultTaskColor: user.settings?.defaultTaskColor ?? DEFAULT_TASK_COLOR,
    },
  };
});

/** For pages: the current user, or a redirect to sign-in. */
export async function requirePageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For actions and route handlers: the current user, or an UnauthorizedError. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
