import type { StravaClientInstance } from "strava-v3";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GridLoader } from "@/src/lib/airquality/rdaqa";
import type { UserId } from "@/src/prisma/users";
import { createServer } from "./server";

const listActivities = vi.fn();
const getActivity = vi.fn();
const getAthlete = vi.fn();

// Only the three calls the resolvers make.
const strava = {
  athlete: { get: getAthlete, listActivities },
  activities: { get: getActivity },
} as unknown as StravaClientInstance;

// Runs a query through the whole server (parsing, validation, resolvers,
// error formatting) without HTTP.
async function run(query: string, variables?: Record<string, unknown>) {
  const response = await createServer().executeOperation(
    { query, variables },
    {
      contextValue: {
        strava,
        userId: "user-1" as UserId,
        // Nothing in the Strava-only resolvers touches the grid loader.
        gridLoader: {} as GridLoader,
      },
    },
  );
  if (response.body.kind !== "single") throw new Error("expected one result");
  return response.body.singleResult;
}

function stravaActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 12345,
    name: "Morning run",
    type: "Run",
    sport_type: "Run",
    distance: 5000,
    moving_time: 1500,
    elapsed_time: 1600,
    start_date: "2026-11-01T14:00:00Z",
    start_latlng: [45.5, -73.6],
    map: { id: "a1", polyline: "full", summary_polyline: "abc" },
    ...overrides,
  };
}

// strava-v3 errors carry the request that failed, credentials included.
function stravaError(statusCode: number, secret = "") {
  return Object.assign(new Error(`Request failed ${secret}`), {
    statusCode,
    data: { message: "Authorization Error" },
    request: { headers: { Authorization: `Bearer ${secret}` } },
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("Query.me", () => {
  it("returns the signed-in athlete in the schema's shape", async () => {
    getAthlete.mockResolvedValue({
      id: 99,
      firstname: "Ada",
      lastname: "Lovelace",
      profile_medium: "https://example.com/ada.jpg",
    });

    const result = await run("{ me { id firstName lastName profileMedium } }");

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      me: {
        id: "99",
        firstName: "Ada",
        lastName: "Lovelace",
        profileMedium: "https://example.com/ada.jpg",
      },
    });
  });
});

describe("Query.activities", () => {
  it("applies the schema's paging defaults and sends no date filters", async () => {
    listActivities.mockResolvedValue([]);

    await run("{ activities { id } }");

    expect(listActivities).toHaveBeenCalledWith({ page: 1, per_page: 30 });
  });

  it("passes variables through as Strava's parameters", async () => {
    listActivities.mockResolvedValue([]);

    await run(
      `query ($after: Int, $before: Int, $page: Int, $perPage: Int) {
        activities(after: $after, before: $before, page: $page, perPage: $perPage) { id }
      }`,
      { after: 1000, before: 2000, page: 2, perPage: 50 },
    );

    expect(listActivities).toHaveBeenCalledWith({
      after: 1000,
      before: 2000,
      page: 2,
      per_page: 50,
    });
  });

  it("maps each activity and returns only the fields asked for", async () => {
    listActivities.mockResolvedValue([
      stravaActivity(),
      stravaActivity({ id: 67890, name: "Treadmill", start_latlng: [] }),
    ]);

    const result = await run(
      "{ activities { id name movingTime startLocation { lat lng } } }",
    );

    expect(result.data).toEqual({
      activities: [
        {
          id: "12345",
          name: "Morning run",
          movingTime: 1500,
          startLocation: { lat: 45.5, lng: -73.6 },
        },
        { id: "67890", name: "Treadmill", movingTime: 1500, startLocation: null },
      ],
    });
  });

  it("rejects an argument of the wrong type before calling Strava", async () => {
    const result = await run('{ activities(page: "two") { id } }');

    expect(result.errors).toHaveLength(1);
    expect(listActivities).not.toHaveBeenCalled();
  });
});

describe("Query.activity", () => {
  it("returns the activity", async () => {
    getActivity.mockResolvedValue(stravaActivity());

    const result = await run('{ activity(id: "12345") { id name } }');

    expect(getActivity).toHaveBeenCalledWith({ id: "12345" });
    expect(result.data).toEqual({
      activity: { id: "12345", name: "Morning run" },
    });
  });

  it("returns null, not an error, when Strava has no such activity", async () => {
    getActivity.mockRejectedValue(stravaError(404));

    const result = await run('{ activity(id: "1") { id } }');

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ activity: null });
  });

  it("reports other Strava failures as errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getActivity.mockRejectedValue(stravaError(429));

    const result = await run('{ activity(id: "1") { id } }');

    expect(result.data).toEqual({ activity: null });
    expect(result.errors?.[0].extensions).toEqual({
      code: "UPSTREAM_ERROR",
      status: 429,
    });
  });
});

describe("error formatting", () => {
  it("keeps credentials from strava-v3 errors out of the response", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    getAthlete.mockRejectedValue(stravaError(401, "SECRET-TOKEN"));

    const result = await run("{ me { id } }");

    expect(JSON.stringify(result)).not.toContain("SECRET-TOKEN");
    expect(result.errors?.[0]).toMatchObject({
      message: "Request to Strava failed",
      path: ["me"],
      extensions: { code: "UPSTREAM_ERROR", status: 401 },
    });
    // The server log gets the summary only, never the request object.
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "Bearer SECRET-TOKEN",
    );
  });

  it("leaves the caller's own query mistakes readable", async () => {
    const result = await run("{ me { nickname } }");

    expect(result.errors?.[0].message).toMatch(/nickname/);
    expect(result.errors?.[0].extensions?.code).not.toBe("UPSTREAM_ERROR");
  });
});
