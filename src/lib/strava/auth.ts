import strava from "strava-v3";
import type { RefreshTokenResponse, SummaryAthlete } from "strava-v3";
import { updateStravaToken, type UserId } from "../../prisma/users";

export type InitialTokenResponse = {
  athlete: SummaryAthlete;
  scope: string;
} & RefreshTokenResponse;

export const STATE_COOKIE = "strava_oauth_state";

let stravaIsConfigured = false;

function configureStrava(): void {
  if (stravaIsConfigured) return;

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing STRAVA_CLIENT_ID and/or STRAVA_CLIENT_ID in .env");
  }

  strava.config({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    access_token: process.env.STRAVA_ACCESS_TOKEN,
  });

  stravaIsConfigured = true;
}

export function stravaRedirectUri(): string {
  const uri = process.env.STRAVA_REDIRECT_URI;
  if (!uri) {
    throw new Error("Missing STRAVA_REDIRECT_URI in your .env");
  }
  return uri;
}

export function stravaAuthorizeUrl(state: string): string {
  configureStrava();

  return strava.oauth.getRequestAccessURL({
    scope: process.env.STRAVA_SCOPE ?? "read,activity:read_all",
    approval_prompt: process.env.NODE_ENV === "production" ? "auto" : "force",
    state,
  });
}

export function exchangeCodeForToken(
  code: string,
): Promise<InitialTokenResponse> {
  configureStrava();
  return strava.oauth.getToken(code) as Promise<InitialTokenResponse>;
}

export function getStravaClientFromToken(token: string) {
  return new strava.client(token);
}

export async function refreshStravaCredentials(
  refreshToken: string,
  userId: UserId,
) {
  configureStrava();
  const { access_token, refresh_token, expires_at } =
    await strava.oauth.refreshToken(refreshToken);

  await updateStravaToken(userId, access_token, refresh_token, expires_at);
}

// Revokes our access on Strava's side too, so the app disappears from the
// athlete's connected apps.
export async function deauthorizeStrava(accessToken: string) {
  configureStrava();
  await strava.oauth.deauthorize({ access_token: accessToken });
}
