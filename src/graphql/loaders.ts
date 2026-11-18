import DataLoader from "dataloader";
import { ensureAirQuality } from "@/src/lib/airquality/ensure";
import { GridLoader, RDAQA_SOURCE } from "@/src/lib/airquality/rdaqa";
import { getActivitiesByStravaIds } from "@/src/prisma/activities";
import {
  getAirQualityByActivity,
  type AirQualityRow,
} from "@/src/prisma/airquality";
import type { UserId } from "@/src/prisma/users";

// The air quality for a batch of the user's Strava activities, in the order
// asked. Two queries however many activities there are: the stored activity
// rows, then their stored readings. Readings that are missing or can be
// improved are then looked up and saved (see ensureAirQuality, which never
// throws).
//
// Air quality is stored against our own activity id, while the graph's
// Activity carries Strava's id, so the first query bridges the two. An
// activity we haven't stored has no reading to give: null.
export async function batchAirQuality(
  userId: UserId,
  gridLoader: GridLoader,
  stravaIds: readonly string[],
): Promise<(AirQualityRow | null)[]> {
  const activities = await getActivitiesByStravaIds(userId, [...stravaIds]);
  const byStravaId = new Map(
    activities.map((activity) => [activity.stravaActivityId, activity]),
  );
  const stored = await getAirQualityByActivity(
    activities.map((activity) => activity.id),
    RDAQA_SOURCE,
  );

  return Promise.all(
    stravaIds.map(async (stravaId) => {
      const activity = byStravaId.get(stravaId);
      if (!activity) return null;
      return ensureAirQuality(activity, stored.get(activity.id), gridLoader);
    }),
  );
}

// One set of loaders per request. A DataLoader collects every load() made
// during the same tick and runs them as one batch, and remembers each result
// for the rest of the request. Sharing across requests would hand one user's
// data to another, hence a fresh set, with its own GridLoader, each time.
export function createLoaders(userId: UserId) {
  const gridLoader = new GridLoader();

  return {
    // Keyed by Strava activity id.
    airQuality: new DataLoader<string, AirQualityRow | null>((stravaIds) =>
      batchAirQuality(userId, gridLoader, stravaIds),
    ),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
