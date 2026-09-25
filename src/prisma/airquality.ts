import type { AirQualityResult } from "@/src/lib/airquality/rdaqa";
import type { ActivityRow } from "./activities.ts";
import { db } from "./db.ts";

export type AirQualityRow = NonNullable<
  Awaited<ReturnType<typeof db.orm.public.AirQualityReading.first>>
>;

type ActivityId = ActivityRow["id"];

export async function getAirQualityByActivity(
  activityIds: ActivityId[],
  source: string,
): Promise<Map<ActivityId, AirQualityRow>> {
  if (activityIds.length === 0) return new Map();

  const rows = await db.orm.public.AirQualityReading.where({ source })
    .where((r) => r.activityId.in(activityIds))
    .all();

  return new Map(rows.map((row) => [row.activityId, row]));
}

export async function saveAirQuality(
  activityId: ActivityId,
  source: string,
  result: AirQualityResult,
): Promise<AirQualityRow> {
  const fields =
    result.status === "unavailable"
      ? {
          status: result.status,
          windowStart: null,
          windowEnd: null,
          pm25: null,
          no2: null,
          o3: null,
          aqhi: null,
        }
      : {
          status: result.status,
          windowStart: result.windowStart.toISOString(),
          windowEnd: result.windowEnd.toISOString(),
          pm25: result.pm25,
          no2: result.no2,
          o3: result.o3,
          aqhi: result.aqhi,
        };

  return db.orm.public.AirQualityReading.upsert({
    conflictOn: { activityId, source },
    create: { activityId, source, ...fields },
    update: fields,
  });
}
