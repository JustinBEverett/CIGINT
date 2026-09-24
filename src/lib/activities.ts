import { RDAQA_RETENTION_DAYS } from "@/src/lib/airquality/pm25";
import { enrichActivitiesWithPm25 } from "@/src/lib/airquality/enrich";
import { getSession } from "@/src/lib/session";
import { syncActivities } from "@/src/lib/strava/sync";
import { getActivitiesForUser, type ActivityRow } from "@/src/prisma/activities";
import {
  getAthleteProfile,
  getLastSyncedAt,
  updateLastSyncedAt,
} from "@/src/prisma/users";

// How long a sync is considered fresh before we bother asking Strava again.
const SYNC_TTL_SECONDS = 15 * 60;

// The first sync only reaches as far back as ECCC still publishes air
// quality data — older activities couldn't be enriched anyway.
const INITIAL_IMPORT_WINDOW_SECONDS = RDAQA_RETENTION_DAYS * 24 * 60 * 60;

export type AthleteProfile = NonNullable<
  Awaited<ReturnType<typeof getAthleteProfile>>
>;

// The single entry point the app uses to read the feed: always reads from
// our DB, syncing from Strava first only if the cached data is stale.
export async function getActivityFeed(): Promise<{
  athlete: AthleteProfile | null;
  activities: ActivityRow[];
}> {
  const session = await getSession();
  if (!session) return { athlete: null, activities: [] };

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

  await enrichActivitiesWithPm25(session.userId);

  const [athlete, activities] = await Promise.all([
    getAthleteProfile(session.userId),
    getActivitiesForUser(session.userId),
  ]);
  return { athlete, activities };
}
