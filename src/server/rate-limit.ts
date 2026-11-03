import "server-only";
import { prisma } from "@/server/db";

/**
 * Fixed-window rate limiter backed by the `RateLimit` table, so the limit is
 * shared across every serverless instance. One atomic upsert per check.
 */

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  status: { limit: 120, windowSeconds: 60 },
  write: { limit: 30, windowSeconds: 60 },
  note: { limit: 60, windowSeconds: 60 },
  search: { limit: 60, windowSeconds: 60 },
  export: { limit: 10, windowSeconds: 300 },
  auth: { limit: 20, windowSeconds: 300 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export async function checkRateLimit(bucket: RateLimitBucket, subject: string): Promise<RateLimitResult> {
  const { limit, windowSeconds } = RATE_LIMITS[bucket];
  const key = `${bucket}:${subject}`;
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowSeconds * 1000);
  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${nextReset})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${nextReset} ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0];
    if (!row) return { ok: true, retryAfterSeconds: 0 };

    // Occasionally sweep expired rows so the table stays small.
    if (Math.random() < 0.01) {
      void prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {});
    }

    const retryAfterSeconds = Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
    return { ok: row.count <= limit, retryAfterSeconds };
  } catch (error) {
    // Fail open: a limiter outage must not lock every user out.
    console.error("[rate-limit] check failed", error);
    return { ok: true, retryAfterSeconds: 0 };
  }
}
