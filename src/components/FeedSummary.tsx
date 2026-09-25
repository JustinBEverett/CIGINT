import {
  cigarettesFor,
  formatCigarettes,
} from "@/src/lib/airquality/cigarettes";
import type { ActivityRow } from "@/src/prisma/activities";
import type { AirQualityRow } from "@/src/prisma/airquality";

type FeedSummaryProps = {
  activities: ActivityRow[];
  readings: Promise<(AirQualityRow | null)[]>;
};

export default async function FeedSummary({
  activities,
  readings: readingsPromise,
}: FeedSummaryProps) {
  const readings = await readingsPromise;

  const total = activities.reduce((sum, activity, i) => {
    const pm25 = readings[i]?.pm25 ?? null;
    return (
      sum +
      (cigarettesFor({
        pm25,
        elapsedTime: activity.elapsedTime,
        movingTime: activity.movingTime,
      }) ?? 0)
    );
  }, 0);

  return (
    <p className="flex items-baseline gap-2">
      <span className="text-4xl font-bold">{formatCigarettes(total)}</span>
      <span className="text-gray-600">cigarettes worth of PM2.5</span>
    </p>
  );
}

export function FeedSummarySkeleton() {
  return <div className="h-10 w-2/3 animate-pulse rounded bg-gray-100" aria-hidden />;
}
