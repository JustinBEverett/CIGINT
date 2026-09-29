import { NextRequest, NextResponse } from "next/server";
import {
  SCREENSHOT_HEADER,
  SESSION_COOKIE,
  screenshotsEnabled,
} from "@/src/lib/constants";

// Reachable without a session: the landing page, the demo feed, the OAuth
// routes, the privacy policy, and logout (so a stale tab logging out goes
// home rather than to Strava). Everything else needs a session cookie.
const PUBLIC_EXACT_PATHS = ["/", "/demo"];
const PUBLIC_PATH_PREFIXES = [
  "/api/strava/authorize",
  "/api/strava/callback",
  "/api/auth/logout",
  "/privacy",
];

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // The header can't see the page's URL, so tell it about screenshot mode.
  if (
    pathname === "/demo" &&
    searchParams.has("screenshot") &&
    screenshotsEnabled()
  ) {
    const headers = new Headers(request.headers);
    headers.set(SCREENSHOT_HEADER, "1");
    return NextResponse.next({ request: { headers } });
  }

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
