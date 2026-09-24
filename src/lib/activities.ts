import { getSession } from "@/src/lib/session";
import { syncActivities } from "@/src/lib/strava/sync";
import { getActivitiesForUser, type ActivityRow } from "@/src/prisma/activities";
import { getLastSyncedAt, updateLastSyncedAt } from "@/src/prisma/users";

// How long a sync is considered fresh before we bother asking Strava again.
const SYNC_TTL_SECONDS = 15 * 60;

// How far back the very first sync for a user reaches. Bounded to match
// the AQ data's lookback window (see Step 3) — no point importing
// activities older than the air quality data can cover.
const INITIAL_IMPORT_WINDOW_SECONDS = 30 * 24 * 60 * 60;

// The single entry point the app uses to read activities: always reads
// from our DB, syncing from Strava first only if the cached data is stale.
export async function getActivities(): Promise<ActivityRow[]> {
  const session = await getSession();
  if (!session) return [];

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

  return getActivitiesForUser(session.userId);
}
