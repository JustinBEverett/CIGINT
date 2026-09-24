import type { StravaClientInstance } from "strava-v3";
import { upsertActivityFromStrava } from "@/src/prisma/activities";
import type { UserId } from "@/src/prisma/users";

const PER_PAGE = 100;

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
      await upsertActivityFromStrava(userId, activity);
    }

    if (activities.length < PER_PAGE) break;
    page++;
  }
}
