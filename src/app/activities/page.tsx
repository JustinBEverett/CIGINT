import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import ActivityCard, { ActivityCardSkeleton } from "@/src/components/ActivityCard";
import AirQualityPanel, {
  AirQualityPanelSkeleton,
} from "@/src/components/AirQualityPanel";
import FeedSummary, { FeedSummarySkeleton } from "@/src/components/FeedSummary";
import { getStoredFeed, syncNewActivities } from "@/src/lib/activities";
import { airQualityFor } from "@/src/lib/airquality/ensure";
import { locationFor } from "@/src/lib/location";
import type { ActivityRow } from "@/src/prisma/activities";

// A first import can look up a few dozen activities; the response streams
// the whole time, so allow up to the Hobby plan maximum.
export const maxDuration = 300;

// Streams in three layers: stored cards render straight from the DB, new
// activities appear at the top once the Strava sync settles, and each card's
// place name and air quality fill in on their own as their lookups finish.
export default async function ActivitiesPage() {
  const feed = await getStoredFeed();
  // The proxy only checks a session cookie exists; this catches one that
  // has expired or been deleted.
  if (!feed) redirect("/api/strava/authorize");

  const readingFor = (activity: ActivityRow) =>
    airQualityFor(activity, feed.airQuality.get(activity.id));

  const newActivities = syncNewActivities(feed);
  const allActivities = newActivities.then((fresh) => [
    ...fresh,
    ...feed.activities,
  ]);

  const renderCard = (activity: ActivityRow) => (
    <ActivityCard
      key={activity.id}
      activity={activity}
      athlete={feed.athlete}
      location={locationFor(activity)}
    >
      <Suspense fallback={<AirQualityPanelSkeleton />}>
        <AirQualityPanel activity={activity} reading={readingFor(activity)} />
      </Suspense>
    </ActivityCard>
  );
  const hasStored = feed.activities.length > 0;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <Suspense fallback={hasStored ? <FeedSummarySkeleton /> : null}>
        <FeedSummary activities={allActivities} readingFor={readingFor} />
      </Suspense>

      <Suspense
        fallback={
          hasStored ? (
            <p className="text-sm text-gray-500" role="status">
              Checking Strava for new activities…
            </p>
          ) : (
            <>
              <FeedSummarySkeleton label="Importing your activities from Strava…" />
              <ActivityCardSkeleton />
              <ActivityCardSkeleton />
            </>
          )
        }
      >
        <NewActivities
          activities={newActivities}
          hasStored={hasStored}
          renderCard={renderCard}
        />
      </Suspense>

      {feed.activities.map(renderCard)}
    </main>
  );
}

async function NewActivities({
  activities,
  hasStored,
  renderCard,
}: {
  activities: Promise<ActivityRow[]>;
  hasStored: boolean;
  renderCard: (activity: ActivityRow) => ReactNode;
}) {
  const fresh = await activities;
  if (fresh.length === 0 && !hasStored) {
    return (
      <p className="text-gray-600">
        No outdoor activities found in the last 30 days.
      </p>
    );
  }
  return <>{fresh.map(renderCard)}</>;
}
