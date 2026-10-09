import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth";

/**
 * Route protection middleware (Edge runtime).
 *
 * IMPORTANT: uses the edge-safe authConfig from src/lib/auth.ts — NOT the
 * instance in src/auth.ts, which wires PrismaAdapter (Node-only) and would
 * crash the Edge runtime. Both instances share the same AUTH_SECRET and
 * session cookie, so req.auth.user here matches the server-side session.
 *
 * NOTE: Next.js only scans src/ for middleware when the app lives in
 * src/app — a root-level middleware.ts is silently ignored (that was the
 * bug that left this file dead). Keep this file at src/middleware.ts.
 */
const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // Protect dashboard, analytics, profile, settings, and activity routes.
  const protectedPaths = [
    "/dashboard",
    "/analytics",
    "/profile",
    "/settings",
    "/activity",
  ];

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !isLoggedIn) {
    // Preserve intended destination for post-login redirect.
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on all page routes; skip static assets and /api/auth (handled by NextAuth).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|api/auth).*)",
  ],
};
