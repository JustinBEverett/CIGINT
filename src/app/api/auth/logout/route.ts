import { appUrl } from "@/src/lib/app-url";
import { SESSION_COOKIE } from "@/src/lib/constants";
import { deleteSessionByToken } from "@/src/prisma/users";
import { NextRequest, NextResponse } from "next/server";

// POST only, and the session cookie is SameSite=Lax, so another site can't
// trigger a logout.
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await deleteSessionByToken(token);

  const response = NextResponse.redirect(appUrl("/"), 303);
  response.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
