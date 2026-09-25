import { appUrl } from "@/src/lib/app-url";
import { DEV_BYPASS_ACTIVE, SESSION_COOKIE } from "@/src/lib/constants";
import { getSession } from "@/src/lib/session";
import { deauthorizeStrava } from "@/src/lib/strava/auth";
import { deleteUserData } from "@/src/prisma/users";
import { NextResponse } from "next/server";

export async function POST() {
  // The local dev bypass points at the real user in the shared database.
  if (DEV_BYPASS_ACTIVE) {
    return NextResponse.json(
      { error: "Account deletion is disabled while DEV_USER_ID is set." },
      { status: 403 },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(appUrl("/"), 303);
  }

  try {
    await deauthorizeStrava(session.client.access_token);
  } catch (error) {
    // Still delete our copy — the user asked for their data to go.
    console.error("Strava deauthorize failed", error);
  }

  await deleteUserData(session.userId);

  const response = NextResponse.redirect(appUrl("/"), 303);
  response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
