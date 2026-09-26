import Link from "next/link";
import { getSessionUserId } from "@/src/lib/session";

export default async function SiteHeader() {
  const userId = await getSessionUserId();

  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-xl items-center justify-between p-4">
        <Link href={userId ? "/activities" : "/"} className="w-32">
          <img alt="CIGINT Logo" src="/assets/wordmark-black.svg" />
        </Link>

        {userId && (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/activities" className="text-gray-700 hover:underline">
              Feed
            </Link>
            <Link href="/account" className="text-gray-700 hover:underline">
              Account
            </Link>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="text-gray-700 hover:underline">
                Log out
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
