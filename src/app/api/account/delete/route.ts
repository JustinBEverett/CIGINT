import { appUrl } from "@/src/lib/app-url";
import { REVOKE_STRAVA_ON_DELETE, SESSION_COOKIE } from "@/src/lib/constants";
import { getSession } from "@/src/lib/session";
import { deauthorizeStrava } from "@/src/lib/strava/auth";
import { describeStravaError } from "@/src/lib/strava/error";
import { deleteUserData } from "@/src/prisma/users";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(appUrl("/"), 303);
  }

  if (REVOKE_STRAVA_ON_DELETE) {
    try {
      await deauthorizeStrava(session.client.access_token);
    } catch (error) {
      // Still delete our copy — the user asked for their data to go.
      console.error("Strava deauthorize failed", describeStravaError(error));
    }
  }

  await deleteUserData(session.userId);

  const response = NextResponse.redirect(appUrl("/"), 303);
  response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
