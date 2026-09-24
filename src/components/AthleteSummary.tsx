import Image from "next/image";

type AthleteSummaryProps = {
  firstName?: string | null;
  lastName?: string | null;
  profileMedium?: string | null;
  startDate: string;
};

function formatStartDate(startDate: string): string {
  const start = new Date(startDate);
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round(
    (startOfDay(new Date()) - startOfDay(start)) / dayMs,
  );

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return start.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export default function AthleteSummary({
  firstName,
  lastName,
  profileMedium,
  startDate,
}: AthleteSummaryProps) {
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Athlete";
  // Strava returns a relative placeholder path when there's no profile photo.
  const hasAvatar = profileMedium?.startsWith("http");

  return (
    <div className="athlete-summary flex flex-row gap-4">
      <div className="athlete-avatar h-[60px] w-[60px] rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {hasAvatar ? (
          <Image
            alt={name}
            src={profileMedium!}
            width="60"
            height="60"
            loading="eager"
            unoptimized
          />
        ) : (
          <span className="text-lg font-bold text-gray-500">
            {name.charAt(0)}
          </span>
        )}
      </div>
      <div className="athlete-summary--details flex flex-col justify-center">
        <div className="text-sm font-bold">{name}</div>
        <div className="text-xs text-gray-500">{formatStartDate(startDate)}</div>
      </div>
    </div>
  );
}
