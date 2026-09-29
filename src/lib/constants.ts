// Deliberately dependency-free — imported by the proxy, which can't pull in
// DB clients or anything else heavy.
export const SESSION_COOKIE = "cigint_session";

// Set by the proxy on /demo?screenshot requests so the site header can look
// signed in for screenshots. Only honoured where DEMO_SCREENSHOT=1 (see
// src/lib/demo.ts), never in production.
export const SCREENSHOT_HEADER = "x-cigint-screenshot";

export function screenshotsEnabled(): boolean {
  return process.env.DEMO_SCREENSHOT === "1";
}

// Local development uses the same Strava app as production, and
// deauthorizing revokes that app's access for the athlete everywhere, so
// deleting a local account would log them out of production too. Only
// production revokes Strava access; local deletes remove local data only.
// Vercel always sets NODE_ENV=production.
export const REVOKE_STRAVA_ON_DELETE = process.env.NODE_ENV === "production";
