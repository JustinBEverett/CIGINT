import { RDAQA_RETENTION_DAYS, RDAQA_SOURCE } from "@/src/lib/airquality/rdaqa";
import { getSession } from "@/src/lib/session";
import { syncActivities } from "@/src/lib/strava/sync";
import { getActivitiesForUser, type ActivityRow } from "@/src/prisma/activities";
import {
  getAirQualityByActivity,
  type AirQualityRow,
} from "@/src/prisma/airquality";
import {
  getAthleteProfile,
  getLastSyncedAt,
  updateLastSyncedAt,
} from "@/src/prisma/users";

// How long a sync is considered fresh before we bother asking Strava again.
const SYNC_TTL_SECONDS = 15 * 60;

// The first sync only reaches as far back as ECCC still publishes air
// quality data — older activities couldn't be looked up anyway.
const INITIAL_IMPORT_WINDOW_SECONDS = RDAQA_RETENTION_DAYS * 24 * 60 * 60;

export type AthleteProfile = NonNullable<
  Awaited<ReturnType<typeof getAthleteProfile>>
>;

export interface ActivityFeed {
  athlete: AthleteProfile | null;
  activities: ActivityRow[];
  // Whatever is already stored; missing or improvable readings are filled in
  // while the page streams (see ensureAirQuality).
  airQuality: Map<ActivityRow["id"], AirQualityRow>;
}

// The single entry point the app uses to read the feed: always reads from
// our DB, syncing from Strava first only if the cached data is stale.
export async function getActivityFeed(): Promise<ActivityFeed> {
  const session = await getSession();
  if (!session) {
    return { athlete: null, activities: [], airQuality: new Map() };
  }

  const lastSyncedAt = await getLastSyncedAt(session.userId);
  const lastSyncedAtMs = lastSyncedAt ? new Date(lastSyncedAt).getTime() : null;
  const isStale =
    lastSyncedAtMs === null ||
    Date.now() - lastSyncedAtMs > SYNC_TTL_SECONDS * 1000;

  if (isStale) {
    const after = lastSyncedAtMs
      ? Math.floor(lastSyncedAtMs / 1000)
      : Math.floor(Date.now() / 1000) - INITIAL_IMPORT_WINDOW_SECONDS;

    await syncActivities(session.client, session.userId, after);
    await updateLastSyncedAt(session.userId);
  }

  const [athlete, activities] = await Promise.all([
    getAthleteProfile(session.userId),
    getActivitiesForUser(session.userId),
  ]);
  const airQuality = await getAirQualityByActivity(
    activities.map((activity) => activity.id),
    RDAQA_SOURCE,
  );

  return { athlete, activities, airQuality };
}
