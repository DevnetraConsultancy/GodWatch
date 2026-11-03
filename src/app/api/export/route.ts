import { NextResponse, type NextRequest } from "next/server";
import { getHabitHistory } from "@/server/data";
import { checkRateLimit } from "@/server/rate-limit";
import { getCurrentUser } from "@/server/session";
import { buildExportRows, toCSV } from "@/lib/export";

export const dynamic = "force-dynamic";

/** GET /api/export?format=csv|json — the signed-in user's last 365 days. */
export async function GET(req: NextRequest): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format");
  if (format !== "csv" && format !== "json") {
    return NextResponse.json({ error: "Format must be csv or json." }, { status: 400 });
  }

  const limit = await checkRateLimit("export", user.id);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many exports. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { tasks, cells } = await getHabitHistory(user.id);
  const rows = buildExportRows(tasks, cells, user.today);
  const headers = { "Cache-Control": "private, no-store" };

  if (format === "json") return NextResponse.json({ rows, generatedFor: user.today }, { headers });
  return new Response(toCSV(rows), {
    headers: {
      ...headers,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="god-watch-${user.today}.csv"`,
    },
  });
}
