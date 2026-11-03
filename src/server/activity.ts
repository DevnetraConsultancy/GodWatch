import "server-only";
import { Prisma, type ActivityType } from "@prisma/client";
import { prisma } from "@/server/db";

/** Record an audit-trail entry. Never throws: logging must not break the action. */
export async function logActivity(
  userId: string,
  type: ActivityType,
  metadata?: Prisma.InputJsonObject
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: { userId, type, metadata: metadata ?? Prisma.JsonNull },
    });
  } catch (error) {
    console.error("[activity] failed to log", type, error);
  }
}
