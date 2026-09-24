import { cookies } from "next/headers";
import {
  getStravaCredentials,
  getUserIdForSessionToken,
  type UserId,
} from "../prisma/users";
import {
  getStravaClientFromToken,
  refreshStravaCredentials,
} from "./strava/auth";
import { StravaClientInstance } from "strava-v3";
import { SESSION_COOKIE } from "./constants";

export interface Session {
  client: StravaClientInstance;
  userId: UserId;
}

// Strava only allows one Authorization Callback Domain per app, so a
// single Strava app can't serve both localhost and production OAuth
// callbacks. Locally, DEV_USER_ID skips the cookie/OAuth flow entirely
// and acts as a fixed user instead. The NODE_ENV guard means this can
// never activate in production regardless of what's set in the env —
// Vercel always sets NODE_ENV=production for deployed environments, and
// this value is only ever meant to live in a local .env anyway.
const DEV_USER_ID =
  process.env.NODE_ENV !== "production"
    ? (process.env.DEV_USER_ID as UserId | undefined)
    : undefined;

export async function getSession(): Promise<Session | undefined> {
  const userId = DEV_USER_ID ?? (await resolveUserIdFromCookie());
  if (!userId) return;

  return buildSession(userId);
}

// The session cookie only ever gets resolved to a userId here — everything
// downstream (sync, DB reads) is keyed on that instead.
async function resolveUserIdFromCookie(): Promise<UserId | undefined> {
  const reqCookies = await cookies();
  const sessionToken = reqCookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return undefined;

  const userId = await getUserIdForSessionToken(sessionToken);
  return userId ?? undefined;
}

async function buildSession(userId: UserId): Promise<Session | undefined> {
  const creds = await getStravaCredentials(userId);
  if (!creds) return;

  const { refreshToken, expiresAt } = creds;
  if (expiresAt && new Date(expiresAt).valueOf() < Date.now()) {
    await refreshStravaCredentials(refreshToken, userId);
  }

  const refreshedCreds = await getStravaCredentials(userId);
  if (!refreshedCreds) {
    throw new Error("Error refreshing credentials.");
  }

  const client = getStravaClientFromToken(refreshedCreds.accessToken);
  return { client, userId };
}
