import { Suspense } from "react";
import ActivityCard from "@/src/components/ActivityCard";
import AirQualityPanel, {
  AirQualityPanelSkeleton,
} from "@/src/components/AirQualityPanel";
import FeedSummary, { FeedSummarySkeleton } from "@/src/components/FeedSummary";
import { getActivityFeed } from "@/src/lib/activities";
import { ensureAirQuality } from "@/src/lib/airquality/ensure";
import { GridLoader } from "@/src/lib/airquality/rdaqa";

// A first import can look up a few dozen activities; the response streams
// the whole time, so allow up to the Hobby plan maximum.
export const maxDuration = 300;

export default async function ActivitiesPage() {
  const { athlete, activities, airQuality } = await getActivityFeed();

  // All lookups start now and share one loader, so an hour's files are only
  // downloaded once. Activities are newest first, and so is the download
  // queue, so the cards at the top fill in first.
  const loader = new GridLoader();
  const readings = activities.map((activity) =>
    ensureAirQuality(activity, airQuality.get(activity.id), loader),
  );

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <section className="flex flex-col gap-1 rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Last 4 weeks</p>
        <Suspense fallback={<FeedSummarySkeleton />}>
          <FeedSummary activities={activities} readings={Promise.all(readings)} />
        </Suspense>
        <p className="text-xs text-gray-500">
          Air quality from Environment and Climate Change Canada&apos;s RDAQA
          10&nbsp;km analysis, averaged over the 3 hours up to each
          activity&apos;s start. AQHI is our estimate from the same data.
        </p>
      </section>

      {activities.length === 0 && (
        <p className="text-gray-600">
          No activities found in the last four weeks.
        </p>
      )}

      {activities.map((activity, i) => (
        <ActivityCard key={activity.id} activity={activity} athlete={athlete}>
          <Suspense fallback={<AirQualityPanelSkeleton />}>
            <AirQualityPanel activity={activity} reading={readings[i]} />
          </Suspense>
        </ActivityCard>
      ))}
    </main>
  );
}
