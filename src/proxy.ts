import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/constants";

// Paths reachable without a session. The OAuth routes obviously need to
// be — everything else requires a cookie until there's a real landing
// page, at which point "/" moves into this list.
const PUBLIC_PATHS = ["/api/strava/authorize", "/api/strava/callback"];

export function proxy(request: NextRequest) {
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
