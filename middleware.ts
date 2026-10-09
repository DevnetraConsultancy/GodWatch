import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Route protection middleware.
 * Uses the Auth.js v5 `auth` wrapper for edge-compatible session checks.
 */
export default auth((req) => {
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
    const loginUrl = new URL("/login", req.nextUrl.origin);
    // Preserve intended destination for post-login redirect.
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// Match all routes except static assets and api/auth.
export const config = {
  matcher: [
    /*
     * Run middleware on:
     *  - all page routes
     *  - api routes (excluding /api/auth which is handled by NextAuth)
     * Skip:
     *  - static files (_next, images, favicon, icons, manifest, sw)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|api/auth).*)",
  ],
};

