export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import DeleteAccountForm from "@/src/components/DeleteAccountForm";
import { DEV_BYPASS_ACTIVE } from "@/src/lib/constants";
import { getSessionUserId } from "@/src/lib/session";
import { getAthleteProfile } from "@/src/prisma/users";

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
        {DEV_BYPASS_ACTIVE ? (
          <p className="text-sm text-gray-500">
            Disabled while DEV_USER_ID is set, since that points at a real user.
          </p>
        ) : (
          <DeleteAccountForm />
        )}
      </section>
    </main>
  );
}
