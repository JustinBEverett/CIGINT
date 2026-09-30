export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import ConnectButton from "@/src/components/ConnectButton";
import DeleteAccountForm from "@/src/components/DeleteAccountForm";
import { REVOKE_STRAVA_ON_DELETE } from "@/src/lib/constants";
import { getSessionUserId } from "@/src/lib/session";
import { getAthleteProfile } from "@/src/prisma/users";

export const metadata: Metadata = { title: "Account" };

// Public: signed out, it's where you log in; signed in, where you log out or
// delete your data.
export default async function AccountPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-gray-600">
          Connect your Strava account to see the air quality for your
          activities. CIGINT only reads your activities, and you can disconnect
          at any time.
        </p>
        <div>
          <ConnectButton />
        </div>
      </main>
    );
  }

  const athlete = await getAthleteProfile(userId);
  const name =
    [athlete?.firstName, athlete?.lastName].filter(Boolean).join(" ") ||
    "your account";

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-gray-600">Connected to Strava as {name}.</p>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-red-200 p-4">
        <h2 className="font-semibold">Disconnect and delete my data</h2>
        <p className="text-sm text-gray-600">
          Revokes cigint&apos;s access on Strava and permanently deletes your
          profile, sessions, tokens and imported activities from our database.
        </p>
        {!REVOKE_STRAVA_ON_DELETE && (
          <p className="text-sm text-gray-500">
            Development: this deletes local data only. Strava access isn&apos;t
            revoked, because production uses the same Strava app.
          </p>
        )}
        <DeleteAccountForm />
      </section>
    </main>
  );
}
