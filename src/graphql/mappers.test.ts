import type { SummaryActivity, SummaryAthlete } from "strava-v3";
import { describe, expect, it } from "vitest";
import { toActivity, toAthlete, toLatLng } from "./mappers";

// Only the fields the mapper reads; the rest of Strava's object is noise here.
function stravaActivity(
  overrides: Record<string, unknown> = {},
): SummaryActivity {
  return {
    id: 12345,
    name: "Morning run",
    type: "Run",
    sport_type: "TrailRun",
    distance: 5000.5,
    moving_time: 1500,
    elapsed_time: 1600,
    start_date: "2026-11-01T14:00:00Z",
    start_latlng: [45.5, -73.6],
    map: { id: "a1", polyline: "full", summary_polyline: "abc" },
    ...overrides,
  } as unknown as SummaryActivity;
}

function stravaAthlete(overrides: Record<string, unknown> = {}) {
  return {
    id: 99,
    firstname: "Ada",
    lastname: "Lovelace",
    profile_medium: "https://example.com/ada.jpg",
    ...overrides,
  } as unknown as SummaryAthlete;
}

describe("toLatLng", () => {
  it("names the pair", () => {
    expect(toLatLng([45.5, -73.6])).toEqual({ lat: 45.5, lng: -73.6 });
  });

  it("treats the empty array Strava sends without GPS as null", () => {
    expect(toLatLng([])).toBeNull();
  });

  it("treats null and non-arrays as null", () => {
    expect(toLatLng(null)).toBeNull();
    expect(toLatLng(undefined)).toBeNull();
    expect(toLatLng("45.5,-73.6")).toBeNull();
  });

  it("rejects a pair that isn't two finite numbers", () => {
    expect(toLatLng([45.5])).toBeNull();
    expect(toLatLng([NaN, -73.6])).toBeNull();
    expect(toLatLng(["45.5", "-73.6"])).toBeNull();
  });

  it("keeps a coordinate of zero", () => {
    expect(toLatLng([0, 0])).toEqual({ lat: 0, lng: 0 });
  });
});

describe("toActivity", () => {
  it("renames snake_case fields and stringifies the id", () => {
    expect(toActivity(stravaActivity())).toEqual({
      id: "12345",
      name: "Morning run",
      type: "Run",
      sportType: "TrailRun",
      distance: 5000.5,
      movingTime: 1500,
      elapsedTime: 1600,
      startDate: "2026-11-01T14:00:00Z",
      startLocation: { lat: 45.5, lng: -73.6 },
      map: { summaryPolyline: "abc" },
      averageHeartrate: null,
      maxHeartrate: null,
    });
  });

  it("passes heart rate through when the athlete recorded it", () => {
    const activity = toActivity(
      stravaActivity({ average_heartrate: 150.5, max_heartrate: 178 }),
    );

    expect(activity.averageHeartrate).toBe(150.5);
    expect(activity.maxHeartrate).toBe(178);
  });

  it("keeps a heart rate of zero rather than treating it as missing", () => {
    expect(
      toActivity(stravaActivity({ average_heartrate: 0 })).averageHeartrate,
    ).toBe(0);
  });

  it("has no start location for an activity without GPS", () => {
    expect(
      toActivity(stravaActivity({ start_latlng: [] })).startLocation,
    ).toBeNull();
  });

  it("nulls a missing sport type", () => {
    expect(
      toActivity(stravaActivity({ sport_type: undefined })).sportType,
    ).toBeNull();
  });

  it("nulls the map, or its polyline when Strava sends an empty one", () => {
    expect(toActivity(stravaActivity({ map: null })).map).toBeNull();
    expect(
      toActivity(
        stravaActivity({ map: { id: "a1", polyline: "", summary_polyline: "" } }),
      ).map,
    ).toEqual({ summaryPolyline: null });
  });
});

describe("toAthlete", () => {
  it("renames fields and stringifies the id", () => {
    expect(toAthlete(stravaAthlete())).toEqual({
      id: "99",
      firstName: "Ada",
      lastName: "Lovelace",
      profileMedium: "https://example.com/ada.jpg",
    });
  });

  it("nulls empty strings", () => {
    expect(
      toAthlete(stravaAthlete({ firstname: "", lastname: "", profile_medium: "" })),
    ).toEqual({
      id: "99",
      firstName: null,
      lastName: null,
      profileMedium: null,
    });
  });
});
