// Deliberately dependency-free — imported by the proxy, which can't pull in
// DB clients or anything else heavy.
export const SESSION_COOKIE = "cigint_session";

// Local development uses the same Strava app as production, and
// deauthorizing revokes that app's access for the athlete everywhere, so
// deleting a local account would log them out of production too. Only
// production revokes Strava access; local deletes remove local data only.
// Vercel always sets NODE_ENV=production.
export const REVOKE_STRAVA_ON_DELETE = process.env.NODE_ENV === "production";
