import { cache } from "react";
import {
  GridLoader,
  lookupAirQuality,
  needsLookup,
  RDAQA_SOURCE,
} from "@/src/lib/airquality/rdaqa";
import type { ActivityRow } from "@/src/prisma/activities";
import { saveAirQuality, type AirQualityRow } from "@/src/prisma/airquality";

// One loader per server request, so every lookup in a page render shares
// its downloads.
const requestLoader = cache(() => new GridLoader());

// Memoised per request: a card and the feed summary asking about the same
// activity share one lookup.
export const airQualityFor = cache(
  (activity: ActivityRow, existing: AirQualityRow | undefined) =>
    ensureAirQuality(activity, existing, requestLoader()),
);

// The stored reading if it's as good as it's going to get, otherwise a fresh
// lookup saved over it. Never throws: a failed lookup falls back to whatever
// was stored (or null) and is retried on a later visit, so one bad download
// can't take down the feed it's streaming into.
export async function ensureAirQuality(
  activity: ActivityRow,
  existing: AirQualityRow | undefined,
  loader: GridLoader,
): Promise<AirQualityRow | null> {
  if (!needsLookup(existing, activity.startDate)) return existing ?? null;

  try {
    const result = await lookupAirQuality(
      {
        lat: activity.startLat,
        lng: activity.startLng,
        startDate: activity.startDate,
      },
      loader,
    );
    if (!result) return existing ?? null;

    return await saveAirQuality(activity.id, RDAQA_SOURCE, result);
  } catch (error) {
    console.error(`Air quality lookup failed for activity ${activity.id}`, error);
    return existing ?? null;
  }
}
