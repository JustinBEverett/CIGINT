import { stravaAuthorizeUrl, STATE_COOKIE } from "@/src/lib/strava/auth";
import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const state = randomUUID();
  const response = NextResponse.redirect(stravaAuthorizeUrl(state));

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  console.log(response);
  return response;
}
