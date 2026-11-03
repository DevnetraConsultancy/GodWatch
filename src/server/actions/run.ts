import "server-only";
import type { z } from "zod";
import { checkRateLimit, type RateLimitBucket } from "@/server/rate-limit";
import { requireUser, UnauthorizedError, type CurrentUser } from "@/server/session";
import { firstIssue } from "@/lib/validation";
import type { ActionResult } from "@/types/dto";

/** An error whose message is safe to show to the user. */
export class UserFacingError extends Error {}

/**
 * Shared pipeline for every server action:
 * authenticate, rate-limit, validate, run, and map failures to friendly messages.
 */
export async function runAction<S extends z.ZodType, T>(
  options: { name: string; bucket: RateLimitBucket; schema: S },
  input: unknown,
  handler: (data: z.infer<S>, user: CurrentUser) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const user = await requireUser();

    const limit = await checkRateLimit(options.bucket, user.id);
    if (!limit.ok) {
      return { ok: false, error: `You're going a bit fast. Try again in ${limit.retryAfterSeconds}s.` };
    }

    const parsed = options.schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

    return { ok: true, data: await handler(parsed.data, user) };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { ok: false, error: "Your session has ended. Please sign in again." };
    }
    if (error instanceof UserFacingError) return { ok: false, error: error.message };
    console.error(`[action:${options.name}]`, error);
    return { ok: false, error: "Something went wrong on our side. Please try again." };
  }
}
