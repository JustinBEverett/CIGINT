import { exchangeCodeForToken, STATE_COOKIE } from "@/src/lib/strava/auth";
import { sendGaEvent } from "@/src/lib/analytics";
import { appUrl } from "@/src/lib/app-url";
import { SESSION_COOKIE } from "@/src/lib/constants";
import { loginWithStrava, type StravaTokenFields } from "@/src/prisma/users";
import { after, NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const error = searchParams.get("error");
  const code = searchParams.get("code");

  if (error || !code) {
    return NextResponse.json(
      { error: "Strava error or missing code in callback." },
      { status: 400 },
    );
  }

  // CSRF check: the `state` we handed to Strava must come back unchanged.
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const state = searchParams.get("state");
  if (state !== expectedState) {
    return NextResponse.json(
      { error: "OAuth `state` mismatch." },
      { status: 403 },
    );
  }

  let token;
  try {
    token = await exchangeCodeForToken(code);
  } catch {
    return NextResponse.json(
      { error: "Token exchange failed." },
      { status: 502 },
    );
  }

  const fields: StravaTokenFields = {
    athleteId: token.athlete!.id.toString(),
    firstName: token.athlete?.firstname,
    lastName: token.athlete?.lastname,
    profileMedium: token.athlete?.profile_medium,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: token.expires_at,
    scope: token.scope,
  };

  const { sessionToken, isNewUser } = await loginWithStrava(fields);

  // GA4's recommended event names. Sent from the server so ad blockers
  // don't lose it, and after the response so the redirect isn't delayed.
  after(() =>
    sendGaEvent(request.cookies, isNewUser ? "sign_up" : "login", {
      method: "Strava",
    }),
  );

  const response = NextResponse.redirect(
    appUrl("/activities"),
    303,
  );
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days — matches the Session row's own expiresAt
  });
  return response;
}
