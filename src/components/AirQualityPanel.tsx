import { aqhiRisk, formatAqhi, type AqhiRisk } from "@/src/lib/airquality/aqhi";
import {
  cigarettesFor,
  formatCigarettes,
} from "@/src/lib/airquality/cigarettes";
import { RDAQA_RETENTION_DAYS } from "@/src/lib/airquality/rdaqa";
import type { ActivityRow } from "@/src/prisma/activities";
import type { AirQualityRow } from "@/src/prisma/airquality";

// Follows the AQHI's own colour scale: blue for low risk through red.
const RISK_STYLES: Record<AqhiRisk, string> = {
  Low: "bg-sky-50 text-sky-900",
  Moderate: "bg-amber-50 text-amber-900",
  High: "bg-orange-100 text-orange-900",
  "Very high": "bg-red-100 text-red-900",
};

type AirQualityPanelProps = {
  activity: ActivityRow;
  reading: Promise<AirQualityRow | null>;
};

export default async function AirQualityPanel({
  activity,
  reading: readingPromise,
}: AirQualityPanelProps) {
  const reading = await readingPromise;

  if (!reading) {
    return (
      <p className="text-sm text-gray-500">
        Air quality isn&apos;t published for this time yet. Check back soon.
      </p>
    );
  }

  if (
    reading.status === "unavailable" ||
    reading.aqhi == null ||
    reading.pm25 == null ||
    reading.no2 == null ||
    reading.o3 == null
  ) {
    // Activities without GPS are never imported, so "unavailable" means the
    // activity was either already too old when it was looked up, or outside
    // coverage.
    const ageAtLookupMs =
      new Date(reading.createdAt).getTime() -
      new Date(activity.startDate).getTime();
    const tooOld = ageAtLookupMs > RDAQA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return (
      <p className="text-sm text-gray-500">
        {tooOld
          ? "Air quality data isn't available this far back."
          : "Currently we don't have air quality data for this location. We hope to support activities outside Canada and the US in the future."}
      </p>
    );
  }

  const risk = aqhiRisk(reading.aqhi);
  const cigarettes = cigarettesFor({
    pm25: reading.pm25,
    elapsedTime: activity.elapsedTime,
    movingTime: activity.movingTime,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-md p-3 ${RISK_STYLES[risk]}`}>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">
            AQHI
          </p>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {formatAqhi(reading.aqhi)}
            </span>
            <span className="text-sm font-medium">{risk} risk</span>
          </p>
        </div>
        <div className="rounded-md bg-gray-100 p-3 text-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">
            Cigarettes
          </p>
          <p className="text-3xl font-bold">
            {cigarettes === null ? "—" : formatCigarettes(cigarettes)}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        PM2.5 {reading.pm25.toFixed(1)} µg/m³ · NO₂ {reading.no2.toFixed(1)} ppb
        · O₃ {reading.o3.toFixed(1)} ppb
        {reading.status === "prelim" && (
          <span
            className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600"
            title="Based on ECCC's preliminary analysis. Updated automatically once the final analysis is published."
          >
            Preliminary
          </span>
        )}
      </p>
    </div>
  );
}

export function AirQualityPanelSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2" aria-hidden>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-[76px] rounded-md bg-gray-100" />
        <div className="h-[76px] rounded-md bg-gray-100" />
      </div>
      <div className="h-3 w-2/3 rounded bg-gray-100" />
    </div>
  );
}
