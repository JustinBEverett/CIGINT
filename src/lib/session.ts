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

// The session cookie only ever gets resolved to a userId here — everything
// downstream (sync, DB reads) is keyed on that instead.
export async function getSession(): Promise<Session | undefined> {
  const reqCookies = await cookies();
  const sessionToken = reqCookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return;

  const userId = await getUserIdForSessionToken(sessionToken);
  if (!userId) return;

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
