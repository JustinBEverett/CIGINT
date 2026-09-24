import { cookies } from "next/headers";
import { getStravaCredentials } from "../prisma/users";
import {
  getStravaClientFromToken,
  refreshStravaCredentials,
} from "./strava/auth";
import { cache } from "react";

export const SESSION_COOKIE = "cigint_session";

cache;
export async function getSession() {
  const reqCookies = await cookies();
  const sessionId = reqCookies.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    const creds = await getStravaCredentials(sessionId);
    if (!creds) return;

    const { refreshToken, expiresAt } = creds;
    if (expiresAt && new Date(expiresAt).valueOf() < Date.now()) {
      await refreshStravaCredentials(refreshToken, sessionId);
    }

    const refreshedCreds = await getStravaCredentials(sessionId);
    if (!refreshedCreds) {
      throw new Error("Error refreshing credentials.");
    }

    const { accessToken, athleteId } = refreshedCreds;
    return getStravaClientFromToken(accessToken);
  }
}
