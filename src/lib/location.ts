import { cache } from "react";
import { reverseGeocode } from "@/src/lib/geocode";
import {
  findNearbyLocationName,
  saveActivityLocation,
  type ActivityRow,
} from "@/src/prisma/activities";

// Activities starting from the same spot (to ~100 m) look up their shared
// place name once per request, even when their lookups start together.
const nameForSpot = cache(async (spot: string): Promise<string | null> => {
  const [lat, lng] = spot.split(",").map(Number);
  return (
    (await findNearbyLocationName(lat, lng)) ?? (await reverseGeocode(lat, lng))
  );
});

// The activity's place name, looked up once and stored. Never throws: a
// failed lookup shows nothing this time and is retried on a later visit.
async function ensureLocation(activity: ActivityRow): Promise<string | null> {
  if (activity.locationCheckedAt) return activity.locationName;

  const { startLat: lat, startLng: lng } = activity;
  if (lat == null || lng == null) return null;

  try {
    const name = await nameForSpot(`${lat.toFixed(3)},${lng.toFixed(3)}`);
    await saveActivityLocation(activity.id, name);
    return name;
  } catch (error) {
    console.error(`Location lookup failed for activity ${activity.id}`, error);
    return null;
  }
}

// Memoised per request, like air quality.
export const locationFor = cache(ensureLocation);
