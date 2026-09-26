import {
  cigarettesFor,
  formatCigarettes,
} from "@/src/lib/airquality/cigarettes";
import type { ActivityRow } from "@/src/prisma/activities";
import type { AirQualityRow } from "@/src/prisma/airquality";

type FeedSummaryProps = {
  // Stored and newly synced activities together, once the sync has settled.
  activities: Promise<ActivityRow[]>;
  readingFor: (activity: ActivityRow) => Promise<AirQualityRow | null>;
};

export default async function FeedSummary({
  activities: activitiesPromise,
  readingFor,
}: FeedSummaryProps) {
  const activities = await activitiesPromise;
  if (activities.length === 0) return null;

  const readings = await Promise.all(activities.map(readingFor));
  const total = activities.reduce(
    (sum, activity, i) =>
      sum +
      (cigarettesFor({
        pm25: readings[i]?.pm25 ?? null,
        elapsedTime: activity.elapsedTime,
        movingTime: activity.movingTime,
      }) ?? 0),
    0,
  );

  return (
    <section className="flex flex-col gap-1 rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">Last 30 days</p>
      <p className="flex items-baseline gap-2">
        <span className="text-4xl font-bold">{formatCigarettes(total)}</span>
        <span className="text-gray-600">cigarettes worth of PM2.5</span>
      </p>
      <p className="text-xs text-gray-500">
        Air quality from Environment and Climate Change Canada&apos;s RDAQA
        10&nbsp;km analysis, averaged over the 3 hours up to each
        activity&apos;s start. AQHI is our estimate from the same data.
      </p>
    </section>
  );
}

export function FeedSummarySkeleton({ label }: { label?: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500" role="status">
        {label ?? "Last 30 days"}
      </p>
      <div className="h-10 w-2/3 animate-pulse rounded bg-gray-100" aria-hidden />
    </section>
  );
}
