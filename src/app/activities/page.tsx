import ActivityCard from "@/src/components/ActivityCard";
import AutoRefresh from "@/src/components/AutoRefresh";
import { getActivityFeed } from "@/src/lib/activities";
import {
  cigarettesFor,
  formatCigarettes,
} from "@/src/lib/airquality/cigarettes";

export default async function ActivitiesPage() {
  const { athlete, activities } = await getActivityFeed();

  const total = activities.reduce(
    (sum, activity) => sum + (cigarettesFor(activity) ?? 0),
    0,
  );
  const pending = activities.filter(
    (activity) => activity.pm25 == null && activity.pm25CheckedAt == null,
  ).length;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      {pending > 0 && <AutoRefresh />}

      <section className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Last 4 weeks</p>
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{formatCigarettes(total)}</span>
          <span className="text-gray-600">cigarettes worth of PM2.5</span>
        </p>
        {pending > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Still analysing {pending} {pending === 1 ? "activity" : "activities"}…
          </p>
        )}
      </section>

      {activities.length === 0 && (
        <p className="text-gray-600">
          No activities found in the last four weeks.
        </p>
      )}

      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} athlete={athlete} />
      ))}
    </main>
  );
}
