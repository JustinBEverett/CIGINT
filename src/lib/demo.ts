import type { AthleteProfile } from "@/src/lib/activities";
import { computeAqhi } from "@/src/lib/airquality/aqhi";
import { RDAQA_SOURCE } from "@/src/lib/airquality/rdaqa";
import type { ActivityRow } from "@/src/prisma/activities";
import type { AirQualityRow } from "@/src/prisma/airquality";

// Sample data for the public demo feed: the real components, no database,
// Strava or login. Activities are placed relative to `now` so the dates
// always read as recent ("Today", "Yesterday").

export interface DemoFeed {
  athlete: AthleteProfile;
  activities: ActivityRow[];
  readings: Map<ActivityRow["id"], AirQualityRow>;
  locations: Map<ActivityRow["id"], string>;
}

interface DemoActivity {
  name: string;
  type: string;
  sportType: string;
  place: string;
  hoursAgo: number;
  distanceKm: number;
  movingMinutes: number;
  elapsedMinutes: number;
  // 3-hour averages: PM2.5 in µg/m³, NO₂ and O₃ in ppb.
  pm25: number;
  no2: number;
  o3: number;
  preliminary?: boolean;
}

const HOUR_MS = 60 * 60 * 1000;

// A spread that shows each part of the UI: a preliminary reading, a smoky
// day, clean mountain air, summer ozone in a city, and several sports.
const DEMO_ACTIVITIES: DemoActivity[] = [
  {
    name: "Smoky ride up Knox Mountain",
    type: "Ride",
    sportType: "Ride",
    place: "Kelowna",
    hoursAgo: 3,
    distanceKm: 38.4,
    movingMinutes: 102,
    elapsedMinutes: 115,
    pm25: 142,
    no2: 6.1,
    o3: 38,
    preliminary: true,
  },
  {
    name: "Seawall loop",
    type: "Run",
    sportType: "Run",
    place: "Stanley Park, Vancouver",
    hoursAgo: 27,
    distanceKm: 10.2,
    movingMinutes: 52,
    elapsedMinutes: 55,
    pm25: 6.2,
    no2: 9.8,
    o3: 24.1,
  },
  {
    name: "Garibaldi Lake hike",
    type: "Hike",
    sportType: "Hike",
    place: "Garibaldi Provincial Park, Squamish-Lillooet",
    hoursAgo: 50,
    distanceKm: 18,
    movingMinutes: 310,
    elapsedMinutes: 390,
    pm25: 3.1,
    no2: 0.8,
    o3: 29,
  },
  {
    name: "Don Valley trail run",
    type: "Run",
    sportType: "TrailRun",
    place: "Don Valley, Toronto",
    hoursAgo: 98,
    distanceKm: 12.1,
    movingMinutes: 65,
    elapsedMinutes: 70,
    pm25: 14.5,
    no2: 18.2,
    o3: 52.3,
  },
  {
    name: "Lunch walk",
    type: "Walk",
    sportType: "Walk",
    place: "Beltline, Calgary",
    hoursAgo: 146,
    distanceKm: 3.4,
    movingMinutes: 40,
    elapsedMinutes: 44,
    pm25: 9,
    no2: 21,
    o3: 18,
  },
];

// Screenshot mode (/demo?screenshot) swaps the demo athlete for a display
// name and photo from env, and hides the demo notice. It only works where
// DEMO_SCREENSHOT is set, which is never the case in production, so the
// public page always shows the notice and the monogram.
export function screenshotMode(
  env: Record<string, string | undefined>,
  params: Record<string, string | string[] | undefined>,
): { athlete: AthleteProfile } | null {
  if (env.DEMO_SCREENSHOT !== "1" || params.screenshot === undefined) {
    return null;
  }

  const [firstName, ...rest] = (env.DEMO_SCREENSHOT_NAME ?? "Demo Athlete")
    .trim()
    .split(/\s+/);
  return {
    athlete: {
      firstName,
      lastName: rest.join(" ") || null,
      profileMedium: env.DEMO_SCREENSHOT_AVATAR_URL || null,
    },
  };
}

export function demoFeed(now: number = Date.now()): DemoFeed {
  const createdAt = new Date(now).toISOString();
  const activities: ActivityRow[] = [];
  const readings = new Map<ActivityRow["id"], AirQualityRow>();
  const locations = new Map<ActivityRow["id"], string>();

  DEMO_ACTIVITIES.forEach((demo, i) => {
    const id = `demo-${i + 1}` as ActivityRow["id"];
    const start = now - demo.hoursAgo * HOUR_MS;
    const windowEnd = Math.floor(start / HOUR_MS) * HOUR_MS;

    activities.push({
      id,
      userId: "demo-user" as ActivityRow["userId"],
      stravaActivityId: id,
      name: demo.name,
      type: demo.type,
      sportType: demo.sportType,
      startDate: new Date(start).toISOString(),
      movingTime: demo.movingMinutes * 60,
      elapsedTime: demo.elapsedMinutes * 60,
      distance: demo.distanceKm * 1000,
      startLat: null,
      startLng: null,
      averageHeartrate: null,
      maxHeartrate: null,
      locationName: demo.place,
      locationCheckedAt: createdAt,
      createdAt,
    });

    readings.set(id, {
      id: `${id}-reading` as AirQualityRow["id"],
      activityId: id,
      source: RDAQA_SOURCE,
      status: demo.preliminary ? "prelim" : "final",
      windowStart: new Date(windowEnd - 3 * HOUR_MS).toISOString(),
      windowEnd: new Date(windowEnd).toISOString(),
      pm25: demo.pm25,
      no2: demo.no2,
      o3: demo.o3,
      aqhi: computeAqhi(demo),
      createdAt,
      updatedAt: createdAt,
    });

    locations.set(id, demo.place);
  });

  return {
    athlete: { firstName: "Demo", lastName: "Athlete", profileMedium: null },
    activities,
    readings,
    locations,
  };
}
