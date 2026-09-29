import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import ActivityCard from "@/src/components/ActivityCard";
import AirQualityPanel from "@/src/components/AirQualityPanel";
import FeedSummary from "@/src/components/FeedSummary";
import { demoFeed, screenshotMode } from "@/src/lib/demo";
import type { ActivityRow } from "@/src/prisma/activities";

export const metadata: Metadata = {
  title: "Demo feed",
  description:
    "A sample CIGINT feed: air quality and cigarette equivalents for example Strava activities.",
};

// The same components as /activities, fed sample data instead of the
// database and Strava, so anyone can see the app without logging in.
export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Render per request so the sample dates stay relative to today.
  await connection();
  const feed = demoFeed();
  const screenshot = screenshotMode(process.env, await searchParams);
  if (screenshot) feed.athlete = screenshot.athlete;

  const readingFor = (activity: ActivityRow) =>
    Promise.resolve(feed.readings.get(activity.id) ?? null);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      {!screenshot && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This is a demo feed with sample activities, and the air quality
          numbers are illustrative.{" "}
          <Link href="/" className="font-medium underline">
            Connect your own Strava account
          </Link>{" "}
          to see yours.
        </p>
      )}

      <FeedSummary
        activities={Promise.resolve(feed.activities)}
        readingFor={readingFor}
      />

      {feed.activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          athlete={feed.athlete}
          location={Promise.resolve(feed.locations.get(activity.id) ?? null)}
          linkToStrava={false}
        >
          <AirQualityPanel activity={activity} reading={readingFor(activity)} />
        </ActivityCard>
      ))}
    </main>
  );
}
