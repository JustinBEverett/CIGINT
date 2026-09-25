import type { StravaClientInstance, SummaryActivity } from "strava-v3";
import { upsertActivityFromStrava } from "@/src/prisma/activities";
import type { UserId } from "@/src/prisma/users";

const PER_PAGE = 100;

// Air quality is looked up at the start location, so indoor, trainer and
// manual activities without one aren't imported. The package types
// start_latlng as a tuple or null, but the real API sends [] for activities
// without GPS, so check the shape rather than trusting the type.
export function hasStartLocation(
  activity: Pick<SummaryActivity, "start_latlng">,
): boolean {
  const latlng: unknown = activity.start_latlng;
  return (
    Array.isArray(latlng) &&
    latlng.length >= 2 &&
    Number.isFinite(latlng[0]) &&
    Number.isFinite(latlng[1])
  );
}

// Fetches every activity newer than `after` (a Unix timestamp) and upserts
// each into our DB. Callers decide `after` and whether a sync is due at
// all — this function only knows how to talk to Strava and page through
// results.
export async function syncActivities(
  client: StravaClientInstance,
  userId: UserId,
  after: number,
): Promise<void> {
  let page = 1;

  while (true) {
    const activities = await client.athlete.listActivities({
      after,
      page,
      per_page: PER_PAGE,
    });

    if (activities.length === 0) break;

    for (const activity of activities) {
      if (!hasStartLocation(activity)) continue;
      await upsertActivityFromStrava(userId, activity);
    }

    // The raw page size, not the number kept: a full page with some skipped
    // activities still means Strava may have more.
    if (activities.length < PER_PAGE) break;
    page++;
  }
}
