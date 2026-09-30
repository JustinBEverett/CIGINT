import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { SCREENSHOT_HEADER, screenshotsEnabled } from "@/src/lib/constants";
import { getSessionUserId } from "@/src/lib/session";
import NavLink from "./NavLink";

// Screenshot mode (/demo?screenshot, see src/lib/demo.ts) shows the signed-in
// links. The env check means a spoofed request header does nothing in
// production.
async function isScreenshot(): Promise<boolean> {
  return (
    screenshotsEnabled() &&
    (await headers()).get(SCREENSHOT_HEADER) === "1"
  );
}

// On narrow screens the link to the page you're already on is hidden, to
// keep the nav on one line.
const NAV_LINK =
  "text-gray-700 hover:underline aria-[current=page]:font-semibold max-sm:aria-[current=page]:hidden";

export default async function SiteHeader() {
  const signedIn =
    (await getSessionUserId()) !== undefined || (await isScreenshot());

  return (
    <header className="sticky top-0 z-999 isolate bg-white border-b border-gray-200">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        {/* The wordmark is the home link, so the nav has no "Home". */}
        <Link href="/" className="w-32">
          <Image
            src="/assets/wordmark-black.svg"
            alt="CIGINT"
            width={280}
            height={49}
            priority
            unoptimized
          />
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <NavLink href="/about" className={NAV_LINK}>
            About
          </NavLink>

          {signedIn ? (
            <>
              <NavLink href="/activities" className={NAV_LINK}>
                Feed
              </NavLink>
              <NavLink href="/account" className={NAV_LINK}>
                Account
              </NavLink>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-gray-700 hover:underline">
                  Log out
                </button>
              </form>
            </>
          ) : (
            // A plain <a>, not Link: this is a route handler that redirects to
            // strava.com, not a page to navigate to client-side.
            <a
              href="/api/strava/authorize"
              className="text-gray-700 hover:underline"
            >
              Log in
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
