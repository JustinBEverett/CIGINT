import Image from "next/image";
import Link from "next/link";
import { getSessionUserId } from "@/src/lib/session";
import NavLink from "./NavLink";

// On narrow screens the link to the page you're already on is hidden, which
// swaps Home and Feed as you move between them.
const NAV_LINK =
  "text-gray-700 hover:underline aria-[current=page]:font-semibold max-sm:aria-[current=page]:hidden";

export default async function SiteHeader() {
  const userId = await getSessionUserId();

  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-xl items-center justify-between p-4">
        <Link href={userId ? "/activities" : "/"} className="w-32">
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
          <NavLink href="/" className={NAV_LINK}>
            Home
          </NavLink>

          {userId ? (
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
            <a href="/api/strava/authorize" className="text-gray-700 hover:underline">
              Log in
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
