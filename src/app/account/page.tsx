export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DeleteAccountForm from "@/src/components/DeleteAccountForm";
import { REVOKE_STRAVA_ON_DELETE } from "@/src/lib/constants";
import { getSessionUserId } from "@/src/lib/session";
import { getAthleteProfile } from "@/src/prisma/users";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/api/strava/authorize");

  const athlete = await getAthleteProfile(userId);
  const name =
    [athlete?.firstName, athlete?.lastName].filter(Boolean).join(" ") ||
    "your account";

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <p className="text-gray-600">Connected to Strava as {name}.</p>

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
