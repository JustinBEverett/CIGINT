import { exchangeCodeForToken, STATE_COOKIE } from "@/src/lib/strava/auth";
import { SESSION_COOKIE } from "@/src/lib/session";
import { saveStravaToken, StravaTokenFields } from "@/src/prisma/users";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

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
  if (expectedState && state !== expectedState) {
    return NextResponse.json(
      { error: "OAuth `state` mismatch." },
      { status: 403 },
    );
  }

  const scope = searchParams.get("scope");

  let token;
  try {
    token = await exchangeCodeForToken(code);
  } catch (error) {
    return NextResponse.json(
      { error: "Token exchange failed." },
      { status: 502 },
    );
  }

  const fields: StravaTokenFields = {
    athleteId: token.athlete!.id.toString(),
    firstName: token.athlete?.firstname,
    lastName: token.athlete?.lastname,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: token.expires_at,
    scope: token.scope,
  };

  const sessionId = randomUUID().toString();
  await saveStravaToken(fields, sessionId);

  const response = NextResponse.redirect(
    new URL("/", process.env.APP_ORIGIN),
    303,
  );
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: token.expires_in,
  });
  return response;
}
