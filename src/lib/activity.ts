import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@prisma/client";
import { Prisma } from "@prisma/client";

/**
 * Activity logging helper.
 * Every meaningful user action is recorded for the audit trail.
 */

export interface LogActivityInput {
  userId: string;
  type: ActivityType;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity({
  userId,
  type,
  metadata,
}: LogActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        type,
        metadata: (metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Logging should never break the primary action.
    console.error("[logActivity]", error);
  }
}

