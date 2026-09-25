import { db } from "./db.ts";
import type { SummaryActivity } from "strava-v3";
import type { UserId } from "./users.ts";

export type ActivityRow = NonNullable<
  Awaited<ReturnType<typeof db.orm.public.Activity.first>>
>;

export async function getActivitiesForUser(
  userId: UserId,
): Promise<ActivityRow[]> {
  // Sync already skips activities without a start location; this keeps any
  // stored row without one out of the feed too, since it can never get an
  // air-quality reading.
  return db.orm.public.Activity.where({ userId })
    .where((a) => a.startLat.isNotNull())
    .where((a) => a.startLng.isNotNull())
    .orderBy((a) => a.startDate.desc())
    .all();
}

// Strava's HR fields aren't declared on this package's SummaryActivity type
// even though the real API returns them (present only when the athlete
// recorded heart rate).
type SummaryActivityWithHeartrate = SummaryActivity & {
  average_heartrate?: number;
  max_heartrate?: number;
};

// Insert-only: an activity we already have is left untouched, since a
// stored activity's data never changes once imported.
export async function upsertActivityFromStrava(
  userId: UserId,
  activity: SummaryActivityWithHeartrate,
): Promise<void> {
  await db.orm.public.Activity.upsert({
    conflictOn: { stravaActivityId: activity.id.toString() },
    create: {
      userId,
      stravaActivityId: activity.id.toString(),
      name: activity.name,
      type: activity.type,
      startDate: activity.start_date,
      movingTime: activity.moving_time,
      elapsedTime: activity.elapsed_time,
      distance: activity.distance,
      startLat: activity.start_latlng?.[0],
      startLng: activity.start_latlng?.[1],
      averageHeartrate: activity.average_heartrate,
      maxHeartrate: activity.max_heartrate,
    },
    update: {},
  });
}
