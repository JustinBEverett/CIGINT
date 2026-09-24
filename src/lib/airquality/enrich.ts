import {
  getActivitiesNeedingPm25,
  setActivityPm25,
} from "@/src/prisma/activities";
import type { UserId } from "@/src/prisma/users";
import { getPm25 } from "./pm25";

// Each lookup downloads and decodes a GRIB2 file, so only a few are done per
// request; the rest fill in on later loads.
const BATCH_SIZE = 6;

// A missing file for a very recent activity usually just means ECCC hasn't
// published that hour yet, so don't record it as "no data" straight away.
const PUBLISH_DELAY_MS = 6 * 60 * 60 * 1000;

export async function enrichActivitiesWithPm25(userId: UserId): Promise<void> {
  const pending = await getActivitiesNeedingPm25(userId, BATCH_SIZE);

  await Promise.all(
    pending.map(async (activity) => {
      const { startLat, startLng } = activity;

      if (startLat == null || startLng == null) {
        await setActivityPm25(activity.id, null);
        return;
      }

      try {
        const pm25 = await getPm25({
          lat: startLat,
          lng: startLng,
          date: activity.startDate,
        });

        const isRecent =
          Date.now() - new Date(activity.startDate).getTime() <
          PUBLISH_DELAY_MS;
        if (pm25 === null && isRecent) return;

        await setActivityPm25(activity.id, pm25);
      } catch (error) {
        // Left unchecked so the next load retries it.
        console.error(`PM2.5 lookup failed for activity ${activity.id}`, error);
      }
    }),
  );
}
