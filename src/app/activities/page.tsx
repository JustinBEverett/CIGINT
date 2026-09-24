import AthleteSummary from "@/src/components/AthleteSummary";
import { getActivityFeed } from "@/src/lib/activities";

export default async function ActivitiesPage() {
  const { athlete, activities } = await getActivityFeed();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      {activities.map((activity) => (
        <article
          key={activity.id}
          className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
        >
          <AthleteSummary
            firstName={athlete?.firstName}
            lastName={athlete?.lastName}
            profileMedium={athlete?.profileMedium}
            startDate={activity.startDate}
          />
          <h2 className="font-semibold">{activity.name}</h2>
          <p className="text-sm text-gray-600">
            {(activity.distance / 1000).toFixed(1)} km · PM2.5{" "}
            {activity.pm25 == null ? "—" : `${activity.pm25.toFixed(1)} µg/m³`}
          </p>
        </article>
      ))}
    </main>
  );
}
