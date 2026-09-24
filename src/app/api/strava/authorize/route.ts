import { stravaAuthorizeUrl, STATE_COOKIE } from "@/src/lib/strava/auth";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export function GET() {
  const state = randomUUID();
  const response = NextResponse.redirect(stravaAuthorizeUrl(state));

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
