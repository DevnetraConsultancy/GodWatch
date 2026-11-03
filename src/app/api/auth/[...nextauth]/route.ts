import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/server/auth";
import { checkRateLimit } from "@/server/rate-limit";

export const { GET } = handlers;

/** Sign-in and sign-out requests, rate limited per client IP. */
export async function POST(req: NextRequest): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimit("auth", ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }
  return handlers.POST(req);
}
