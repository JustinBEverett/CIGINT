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
import { describeStravaError } from "./strava/error";

export interface Session {
  client: StravaClientInstance;
  userId: UserId;
}

// The lightweight check: who is this request, without touching Strava.
// Used where only identity matters (landing redirect, header, logout).
export async function getSessionUserId(): Promise<UserId | undefined> {
  const reqCookies = await cookies();
  const sessionToken = reqCookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return undefined;

  const userId = await getUserIdForSessionToken(sessionToken);
  return userId ?? undefined;
}

export async function getSession(): Promise<Session | undefined> {
  const userId = await getSessionUserId();
  if (!userId) return;

  return buildSession(userId);
}

async function buildSession(userId: UserId): Promise<Session | undefined> {
  const creds = await getStravaCredentials(userId);
  if (!creds) return;

  const { refreshToken, expiresAt } = creds;
  if (expiresAt && new Date(expiresAt).valueOf() < Date.now()) {
    try {
      await refreshStravaCredentials(refreshToken, userId);
    } catch (error) {
      console.error(
        "Error refreshing Strava token.",
        describeStravaError(error),
      );
    }
  }

  const refreshedCreds = await getStravaCredentials(userId);
  if (!refreshedCreds) {
    throw new Error("Error refreshing credentials.");
  }

  const client = getStravaClientFromToken(refreshedCreds.accessToken);
  return { client, userId };
}
