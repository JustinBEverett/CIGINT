// Deliberately dependency-free — imported by the proxy, which can't pull in
// DB clients or anything else heavy.
export const SESSION_COOKIE = "cigint_session";

// Strava only allows one Authorization Callback Domain per app, so local
// development skips OAuth and acts as a fixed user instead. Never active in
// production regardless of the env — Vercel always sets NODE_ENV=production.
// `|| undefined` so an empty DEV_USER_ID (e.g. copied from .env.example)
// counts as unset.
export const DEV_USER_ID: string | undefined =
  process.env.NODE_ENV !== "production"
    ? process.env.DEV_USER_ID || undefined
    : undefined;

export const DEV_BYPASS_ACTIVE = DEV_USER_ID !== undefined;
