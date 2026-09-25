import { NextRequest, NextResponse } from "next/server";
import { DEV_BYPASS_ACTIVE, SESSION_COOKIE } from "@/src/lib/constants";

// Reachable without a session: the landing page, the OAuth routes, and the
// privacy policy. Everything else needs a session cookie.
const PUBLIC_EXACT_PATHS = ["/"];
const PUBLIC_PATH_PREFIXES = [
  "/api/strava/authorize",
  "/api/strava/callback",
  "/privacy",
];

export function proxy(request: NextRequest) {
  if (DEV_BYPASS_ACTIVE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(
      new URL("/api/strava/authorize", request.url),
    );
  }

  return NextResponse.next();
}

// Skip Next's own assets and anything in /public (images etc.), which the
// landing page needs to load while logged out.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
