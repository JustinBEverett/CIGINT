import type { AthleteProfile } from "@/src/lib/activities";
import type { ActivityRow } from "@/src/prisma/activities";
import AthleteSummary from "./AthleteSummary";

type ActivityCardProps = {
  activity: ActivityRow;
  athlete: AthleteProfile | null;
  // The air quality section, rendered by the page so it can stream in
  // behind its own Suspense boundary.
  children: React.ReactNode;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : `${minutes}m`;
}

export default function ActivityCard({
  activity,
  athlete,
  children,
}: ActivityCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <AthleteSummary
        firstName={athlete?.firstName}
        lastName={athlete?.lastName}
        profileMedium={athlete?.profileMedium}
        startDate={activity.startDate}
      />

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-semibold">{activity.name}</h2>
        <p className="shrink-0 text-sm text-gray-600">
          {(activity.distance / 1000).toFixed(1)} km ·{" "}
          {formatDuration(activity.movingTime)}
        </p>
      </div>

      {children}

      <a
        href={`https://www.strava.com/activities/${activity.stravaActivityId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start text-xs font-medium text-[#FC4C02] hover:underline"
      >
        View on Strava
      </a>
    </article>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-3 rounded-lg border border-gray-200 p-4"
      aria-hidden
    >
      <div className="flex items-center gap-4">
        <div className="h-[60px] w-[60px] rounded-full bg-gray-100" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 rounded bg-gray-100" />
          <div className="h-3 w-16 rounded bg-gray-100" />
        </div>
      </div>
      <div className="h-4 w-1/2 rounded bg-gray-100" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-[76px] rounded-md bg-gray-100" />
        <div className="h-[76px] rounded-md bg-gray-100" />
      </div>
    </div>
  );
}
