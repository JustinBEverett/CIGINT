import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/constants";

// Paths reachable without a session. The OAuth routes obviously need to
// be — everything else requires a cookie until there's a real landing
// page, at which point "/" moves into this list.
const PUBLIC_PATHS = ["/api/strava/authorize", "/api/strava/callback"];

// Mirrors the dev bypass in lib/session.ts — never active once NODE_ENV
// is production, regardless of what DEV_USER_ID is set to.
const DEV_BYPASS_ACTIVE =
  process.env.NODE_ENV !== "production" && !!process.env.DEV_USER_ID;

export function proxy(request: NextRequest) {
  if (DEV_BYPASS_ACTIVE) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(
      new URL("/api/strava/authorize", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
