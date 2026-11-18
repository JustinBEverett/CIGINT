import type { StravaClientInstance } from "strava-v3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureAirQuality } from "@/src/lib/airquality/ensure";
import {
  getActivitiesByStravaIds,
  getActivitiesForUser,
  type ActivityRow,
} from "@/src/prisma/activities";
import {
  getAirQualityByActivity,
  type AirQualityRow,
} from "@/src/prisma/airquality";
import { getAthleteProfile, getLastSyncedAt, type UserId } from "@/src/prisma/users";
import { createLoaders } from "./loaders";
import { createServer } from "./server";

// Nothing here may reach the database, ECCC or Strava.
vi.mock("@/src/prisma/activities");
vi.mock("@/src/prisma/airquality");
vi.mock("@/src/prisma/users");
vi.mock("@/src/lib/strava/sync");
vi.mock("@/src/lib/activities", () => ({ syncWindowStart: vi.fn() }));
vi.mock("@/src/lib/airquality/ensure", () => ({ ensureAirQuality: vi.fn() }));
vi.mock("@/src/lib/airquality/rdaqa", () => ({
  GridLoader: class {},
  RDAQA_SOURCE: "ECCC RDAQA",
}));

const USER_ID = "user-1" as UserId;

// Activity n is stored as row-n and is Strava's activity "n".
function activity(n: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `row-${n}`,
    userId: USER_ID,
    stravaActivityId: String(n),
    name: `Activity ${n}`,
    type: "Run",
    sportType: "Run",
    startDate: "2026-11-01T14:00:00.000Z",
    // A full day outdoors: at PM2.5 of 22 µg/m³ that is exactly one cigarette.
    movingTime: 86_400,
    elapsedTime: 86_400,
    distance: 5000,
    startLat: 45.5,
    startLng: -73.6,
    averageHeartrate: null,
    maxHeartrate: null,
    ...overrides,
  } as unknown as ActivityRow;
}

function reading(overrides: Record<string, unknown> = {}) {
  return {
    status: "final",
    windowStart: "2026-11-01T12:00:00.000Z",
    windowEnd: "2026-11-01T14:00:00.000Z",
    pm25: 22,
    no2: 4,
    o3: 25,
    aqhi: 7.2,
    ...overrides,
  } as unknown as AirQualityRow;
}

function stored(...activities: ActivityRow[]) {
  vi.mocked(getActivitiesForUser).mockResolvedValue(activities);
  vi.mocked(getActivitiesByStravaIds).mockImplementation(async (_user, ids) =>
    activities.filter((a) => ids.includes(a.stravaActivityId)),
  );
  vi.mocked(getAirQualityByActivity).mockResolvedValue(new Map());
  vi.mocked(getAthleteProfile).mockResolvedValue(null);
  vi.mocked(getLastSyncedAt).mockResolvedValue(null);
}

async function run(query: string) {
  const response = await createServer().executeOperation(
    { query },
    {
      contextValue: {
        strava: {} as StravaClientInstance,
        userId: USER_ID,
        loaders: createLoaders(USER_ID),
      },
    },
  );
  if (response.body.kind !== "single") throw new Error("expected one result");
  return response.body.singleResult;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("airQuality loader", () => {
  it("answers in the order asked, with null for an activity we haven't stored", async () => {
    stored(activity(1), activity(2));
    vi.mocked(ensureAirQuality).mockImplementation(async (a) =>
      reading({ pm25: Number(a.stravaActivityId) }),
    );
    const { airQuality } = createLoaders(USER_ID);

    const results = await Promise.all([
      airQuality.load("2"),
      airQuality.load("999"),
      airQuality.load("1"),
    ]);

    expect(results.map((r) => r && r.pm25)).toEqual([2, null, 1]);
  });

  it("batches loads made together and asks for each id once", async () => {
    stored(activity(1), activity(2));
    vi.mocked(ensureAirQuality).mockResolvedValue(reading());
    const { airQuality } = createLoaders(USER_ID);

    await Promise.all([
      airQuality.load("1"),
      airQuality.load("2"),
      airQuality.load("1"),
    ]);

    expect(getActivitiesByStravaIds).toHaveBeenCalledTimes(1);
    expect(getActivitiesByStravaIds).toHaveBeenCalledWith(USER_ID, ["1", "2"]);
  });

  it("hands the stored reading to ensureAirQuality, so a good one isn't looked up again", async () => {
    const existing = reading();
    stored(activity(1));
    vi.mocked(getAirQualityByActivity).mockResolvedValue(
      new Map([["row-1", existing]]) as Awaited<
        ReturnType<typeof getAirQualityByActivity>
      >,
    );
    vi.mocked(ensureAirQuality).mockImplementation(async (_a, current) => current ?? null);

    const result = await createLoaders(USER_ID).airQuality.load("1");

    expect(result).toBe(existing);
    expect(ensureAirQuality).toHaveBeenCalledWith(
      expect.objectContaining({ id: "row-1" }),
      existing,
      expect.anything(),
    );
  });

  it("remembers results within one set of loaders only", async () => {
    stored(activity(1));
    vi.mocked(ensureAirQuality).mockResolvedValue(reading());
    const first = createLoaders(USER_ID);

    await first.airQuality.load("1");
    await first.airQuality.load("1");
    expect(getActivitiesByStravaIds).toHaveBeenCalledTimes(1);

    await createLoaders(USER_ID).airQuality.load("1");
    expect(getActivitiesByStravaIds).toHaveBeenCalledTimes(2);
  });
});

describe("Activity.airQuality and Activity.cigarettes", () => {
  it("returns the reading and the cigarettes it works out to, in one query", async () => {
    stored(activity(1));
    vi.mocked(ensureAirQuality).mockResolvedValue(reading());

    const result = await run(`{
      feed { activities {
        name
        airQuality { status pm25 no2 o3 aqhi aqhiRisk windowStart windowEnd }
        cigarettes
      } }
    }`);

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      feed: {
        activities: [
          {
            name: "Activity 1",
            airQuality: {
              status: "FINAL",
              pm25: 22,
              no2: 4,
              o3: 25,
              aqhi: 7.2,
              aqhiRisk: "HIGH",
              windowStart: "2026-11-01T12:00:00.000Z",
              windowEnd: "2026-11-01T14:00:00.000Z",
            },
            cigarettes: 1,
          },
        ],
      },
    });
  });

  it("looks up 50 activities with one query for the activities and one for the readings", async () => {
    const fifty = Array.from({ length: 50 }, (_, i) => activity(i + 1));
    stored(...fifty);
    vi.mocked(ensureAirQuality).mockResolvedValue(reading());

    const result = await run(
      "{ feed { activities { airQuality { pm25 } cigarettes } } }",
    );

    expect(result.errors).toBeUndefined();
    expect(getActivitiesByStravaIds).toHaveBeenCalledTimes(1);
    expect(getAirQualityByActivity).toHaveBeenCalledTimes(1);
    expect(ensureAirQuality).toHaveBeenCalledTimes(50);
  });

  it("doesn't touch air quality when it isn't asked for", async () => {
    stored(activity(1));

    await run("{ feed { activities { name } } }");

    expect(getActivitiesByStravaIds).not.toHaveBeenCalled();
    expect(ensureAirQuality).not.toHaveBeenCalled();
  });

  it("returns null for both when the lookup came back empty, without an error", async () => {
    stored(activity(1));
    vi.mocked(ensureAirQuality).mockResolvedValue(null);

    const result = await run(
      "{ feed { activities { airQuality { pm25 } cigarettes } } }",
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      feed: { activities: [{ airQuality: null, cigarettes: null }] },
    });
  });

  it("returns an UNAVAILABLE reading with no values, and no cigarettes", async () => {
    stored(activity(1));
    vi.mocked(ensureAirQuality).mockResolvedValue(
      reading({
        status: "unavailable",
        windowStart: null,
        windowEnd: null,
        pm25: null,
        no2: null,
        o3: null,
        aqhi: null,
      }),
    );

    const result = await run(
      "{ feed { activities { airQuality { status pm25 aqhiRisk } cigarettes } } }",
    );

    expect(result.data).toEqual({
      feed: {
        activities: [
          {
            airQuality: { status: "UNAVAILABLE", pm25: null, aqhiRisk: null },
            cigarettes: null,
          },
        ],
      },
    });
  });

  it("measures exposure from moving time when most of the elapsed time was stops", async () => {
    // Elapsed over 1.5x moving: only the 12 hours moving count (see cigarettes.ts).
    stored(activity(1, { movingTime: 43_200, elapsedTime: 86_400 }));
    vi.mocked(ensureAirQuality).mockResolvedValue(reading());

    const result = await run("{ feed { activities { cigarettes } } }");

    expect(result.data).toEqual({ feed: { activities: [{ cigarettes: 0.5 }] } });
  });
});
