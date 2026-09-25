import type { ActivityRow } from "@/src/prisma/activities";
import { cigarettesFor, formatCigarettes } from "@/src/lib/airquality/cigarettes";
import AthleteSummary from "./AthleteSummary";

type ActivityCardProps = {
  activity: ActivityRow;
  athlete: {
    firstName?: string | null;
    lastName?: string | null;
    profileMedium?: string | null;
  } | null;
};

export default function ActivityCard({ activity, athlete }: ActivityCardProps) {
  const cigarettes = cigarettesFor(activity);
  const isPending = activity.pm25 == null && activity.pm25CheckedAt == null;

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <AthleteSummary
        firstName={athlete?.firstName}
        lastName={athlete?.lastName}
        profileMedium={athlete?.profileMedium}
        startDate={activity.startDate}
      />

      <h2 className="font-semibold">{activity.name}</h2>

      {cigarettes !== null ? (
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCigarettes(cigarettes)}</span>
          <span className="text-sm text-gray-500">cigarettes</span>
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          {isPending
            ? "Calculating air quality…"
            : "No air quality data for this location or date"}
        </p>
      )}

      <p className="text-sm text-gray-600">
        {(activity.distance / 1000).toFixed(1)} km
        {activity.pm25 != null && ` · PM2.5 ${activity.pm25.toFixed(1)} µg/m³`}
        {" · "}
        <a
          href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 underline"
        >
          View on Strava
        </a>
      </p>
    </article>
  );
}
