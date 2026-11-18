import type { StravaClientInstance } from "strava-v3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { syncWindowStart } from "@/src/lib/activities";
import { syncActivities } from "@/src/lib/strava/sync";
import {
  getActivitiesForUser,
  type ActivityRow,
} from "@/src/prisma/activities";
import {
  getAthleteProfile,
  getLastSyncedAt,
  updateLastSyncedAt,
  type UserId,
} from "@/src/prisma/users";
import type { Loaders } from "./loaders";
import { createServer } from "./server";

// The real modules would build a database client.
vi.mock("@/src/prisma/activities");
vi.mock("@/src/prisma/users");
vi.mock("@/src/lib/strava/sync");
// Only the sync-window decision is used; the module also pulls in the
// session code.
vi.mock("@/src/lib/activities", () => ({ syncWindowStart: vi.fn() }));

const USER_ID = "user-1" as UserId;

// Nothing in these tests may reach Strava: any call on this fails the test.
const strava = {} as StravaClientInstance;

async function run(query: string) {
  const response = await createServer().executeOperation(
    { query },
    { contextValue: { strava, userId: USER_ID, loaders: {} as Loaders } },
  );
  if (response.body.kind !== "single") throw new Error("expected one result");
  return response.body.singleResult;
}

function storedActivity(overrides: Record<string, unknown> = {}): ActivityRow {
  return {
    id: "row-1",
    userId: USER_ID,
    stravaActivityId: "12345",
    name: "Morning run",
    type: "Run",
    sportType: "TrailRun",
    startDate: "2026-11-01T14:00:00.000Z",
    movingTime: 1500,
    elapsedTime: 1600,
    distance: 5000,
    startLat: 45.5,
    startLng: -73.6,
    averageHeartrate: null,
    maxHeartrate: null,
    ...overrides,
  } as unknown as ActivityRow;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("Query.feed", () => {
  it("returns the stored profile, activities and last sync time", async () => {
    vi.mocked(getAthleteProfile).mockResolvedValue({
      firstName: "Ada",
      lastName: "Lovelace",
      profileMedium: null,
    } as Awaited<ReturnType<typeof getAthleteProfile>>);
    vi.mocked(getActivitiesForUser).mockResolvedValue([storedActivity()]);
    vi.mocked(getLastSyncedAt).mockResolvedValue("2026-11-02T10:00:00.000Z");

    const result = await run(`{
      feed {
        profile { firstName lastName profileMedium }
        lastSyncedAt
        activities { id name startLocation { lat lng } map { summaryPolyline } }
      }
    }`);

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      feed: {
        profile: { firstName: "Ada", lastName: "Lovelace", profileMedium: null },
        lastSyncedAt: "2026-11-02T10:00:00.000Z",
        activities: [
          {
            // Strava's id, not our row id.
            id: "12345",
            name: "Morning run",
            startLocation: { lat: 45.5, lng: -73.6 },
            map: null,
          },
        ],
      },
    });
  });

  it("only reads the signed-in user's data", async () => {
    vi.mocked(getActivitiesForUser).mockResolvedValue([]);

    await run("{ feed { activities { id } } }");

    expect(getActivitiesForUser).toHaveBeenCalledWith(USER_ID);
    expect(getAthleteProfile).toHaveBeenCalledWith(USER_ID);
    expect(getLastSyncedAt).toHaveBeenCalledWith(USER_ID);
  });

  it("copes with a user who has never synced", async () => {
    vi.mocked(getAthleteProfile).mockResolvedValue(null);
    vi.mocked(getActivitiesForUser).mockResolvedValue([]);
    vi.mocked(getLastSyncedAt).mockResolvedValue(null);

    const result = await run("{ feed { profile { firstName } lastSyncedAt activities { id } } }");

    expect(result.data).toEqual({
      feed: { profile: null, lastSyncedAt: null, activities: [] },
    });
  });

  it("gives a stored activity without coordinates no start location", async () => {
    vi.mocked(getActivitiesForUser).mockResolvedValue([
      storedActivity({ startLat: null, startLng: null }),
    ]);

    const result = await run("{ feed { activities { startLocation { lat } } } }");

    expect(result.data).toEqual({
      feed: { activities: [{ startLocation: null }] },
    });
  });
});

describe("Mutation.syncActivities", () => {
  it("does nothing, and doesn't ask Strava, when the last sync is recent", async () => {
    vi.mocked(syncWindowStart).mockReturnValue(null);

    const result = await run("mutation { syncActivities { id } }");

    expect(result.data).toEqual({ syncActivities: [] });
    expect(syncActivities).not.toHaveBeenCalled();
    expect(updateLastSyncedAt).not.toHaveBeenCalled();
  });

  it("syncs from the window start and returns only the new activities", async () => {
    vi.mocked(syncWindowStart).mockReturnValue(1_700_000_000_000);
    vi.mocked(getActivitiesForUser)
      .mockResolvedValueOnce([storedActivity()])
      .mockResolvedValueOnce([
        storedActivity(),
        storedActivity({ id: "row-2", stravaActivityId: "67890", name: "Evening ride" }),
      ]);

    const result = await run("mutation { syncActivities { id name } }");

    expect(syncActivities).toHaveBeenCalledWith(strava, USER_ID, 1_700_000_000);
    expect(updateLastSyncedAt).toHaveBeenCalledWith(USER_ID);
    expect(result.data).toEqual({
      syncActivities: [{ id: "67890", name: "Evening ride" }],
    });
  });

  it("reports a Strava failure, and doesn't record the sync", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(syncWindowStart).mockReturnValue(1_700_000_000_000);
    vi.mocked(getActivitiesForUser).mockResolvedValue([]);
    vi.mocked(syncActivities).mockRejectedValue(
      Object.assign(new Error("Rate Limit Exceeded"), { statusCode: 429 }),
    );

    const result = await run("mutation { syncActivities { id } }");

    expect(result.data).toBeNull();
    expect(result.errors?.[0].extensions).toEqual({
      code: "UPSTREAM_ERROR",
      status: 429,
    });
    expect(updateLastSyncedAt).not.toHaveBeenCalled();
  });
});

describe("error labelling", () => {
  it("doesn't blame Strava for a database failure, or leak its details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getAthleteProfile).mockRejectedValue(
      new Error("connect ECONNREFUSED postgres://user:SECRET-PW@db:5432/app"),
    );
    vi.mocked(getActivitiesForUser).mockResolvedValue([]);
    vi.mocked(getLastSyncedAt).mockResolvedValue(null);

    const result = await run("{ feed { activities { id } } }");

    expect(JSON.stringify(result)).not.toContain("SECRET-PW");
    expect(result.errors?.[0]).toMatchObject({
      message: "Internal server error",
      path: ["feed"],
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  });
});
