export const dynamic = "force-dynamic";

import Link from "next/link";
import ConnectButton from "@/src/components/ConnectButton";
import { getSessionUserId } from "@/src/lib/session";

export default async function Home() {
  const userId = await getSessionUserId();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-4 pt-8">
        <h1 className="text-4xl font-bold tracking-tight">
          How many cigarettes was your run worth?
        </h1>
        <p className="text-lg text-gray-600">
          CIGINT pulls your Strava activities, looks up the air quality where
          and when you were moving, and turns it into a cigarette equivalent.
        </p>
        <div>
          {userId ? (
            <Link
              href="/activities"
              className="inline-block rounded bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-700"
            >
              Go to your feed
            </Link>
          ) : (
            <ConnectButton />
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-gray-700">
          <li>
            Connect your Strava account (read-only access to your activities).
          </li>
          <li>
            For each activity we look up PM2.5 (fine particulate) at the start
            location from Environment and Climate Change Canada&apos;s
            10&nbsp;km air quality analysis.
          </li>
          <li>
            Exposure is PM2.5 × time outside, converted with a common rule of
            thumb: 22&nbsp;µg/m³ for 24 hours is about one cigarette.
          </li>
        </ol>
      </section>

      <section className="flex flex-col gap-2 text-sm text-gray-600">
        <h2 className="text-base font-semibold text-gray-800">Good to know</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Coverage is Canada (apart from the high Arctic), the contiguous
            United States (apart from the southern tip of Texas and the Florida
            Keys) and most of Alaska.
          </li>
          <li>
            Only outdoor activities with GPS from the last 30 days are shown,
            since that&apos;s as far back as the air quality data goes.
          </li>
          <li>
            It&apos;s a rough estimate for fun. It uses the air at the start of
            your activity, not your exact route or breathing rate.
          </li>
        </ul>
      </section>
    </main>
  );
}
