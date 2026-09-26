import { RDAQA_RETENTION_DAYS, RDAQA_SOURCE } from "@/src/lib/airquality/rdaqa";
import { getSession, type Session } from "@/src/lib/session";
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

const HOUR_MS = 60 * 60 * 1000;

// How long a sync is considered fresh before we bother asking Strava again.
const SYNC_TTL_MS = 15 * 60 * 1000;

// The first sync only reaches as far back as ECCC still publishes air
// quality data — older activities couldn't be looked up anyway.
const INITIAL_IMPORT_WINDOW_MS = RDAQA_RETENTION_DAYS * 24 * HOUR_MS;

// Strava's `after` filters on an activity's start time, not when it was
// uploaded, so a watch that syncs hours later would slip behind the last
// sync. Looking back past it catches those; activities we already have are
// ignored by the upsert.
const LATE_UPLOAD_OVERLAP_MS = 48 * HOUR_MS;

export type AthleteProfile = NonNullable<
  Awaited<ReturnType<typeof getAthleteProfile>>
>;

export interface StoredFeed {
  session: Session;
  athlete: AthleteProfile | null;
  activities: ActivityRow[];
  // Whatever is already stored; missing or improvable readings are filled in
  // while the page streams (see ensureAirQuality).
  airQuality: Map<ActivityRow["id"], AirQualityRow>;
  lastSyncedAt: string | null;
}

// Everything already in our DB: fast enough to render straight away, before
// anything is asked of Strava.
export async function getStoredFeed(): Promise<StoredFeed | null> {
  const session = await getSession();
  if (!session) return null;

  const [athlete, activities, lastSyncedAt] = await Promise.all([
    getAthleteProfile(session.userId),
    getActivitiesForUser(session.userId),
    getLastSyncedAt(session.userId),
  ]);
  const airQuality = await getAirQualityByActivity(
    activities.map((activity) => activity.id),
    RDAQA_SOURCE,
  );

  return { session, athlete, activities, airQuality, lastSyncedAt };
}

export function syncWindowStart(
  lastSyncedAt: string | null,
  now: number,
): number | null {
  if (lastSyncedAt === null) return now - INITIAL_IMPORT_WINDOW_MS;

  const lastSyncedAtMs = new Date(lastSyncedAt).getTime();
  if (now - lastSyncedAtMs <= SYNC_TTL_MS) return null;
  return lastSyncedAtMs - LATE_UPLOAD_OVERLAP_MS;
}

// Syncs with Strava if the cached data is stale and returns the activities
// that weren't already stored. A Strava failure is logged and treated as
// "nothing new", so the page still shows everything we have.
export async function syncNewActivities(
  { session, activities, lastSyncedAt }: StoredFeed,
  now: number = Date.now(),
): Promise<ActivityRow[]> {
  const windowStart = syncWindowStart(lastSyncedAt, now);
  if (windowStart === null) return [];

  try {
    await syncActivities(
      session.client,
      session.userId,
      Math.floor(windowStart / 1000),
    );
    await updateLastSyncedAt(session.userId);
  } catch (error) {
    console.error("Strava sync failed; showing stored activities", error);
    return [];
  }

  const known = new Set(activities.map((activity) => activity.id));
  const all = await getActivitiesForUser(session.userId);
  return all.filter((activity) => !known.has(activity.id));
}
