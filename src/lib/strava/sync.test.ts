import type { StravaClientInstance, SummaryActivity } from "strava-v3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { upsertActivityFromStrava } from "@/src/prisma/activities";
import type { UserId } from "@/src/prisma/users";
import { hasStartLocation, syncActivities } from "./sync";

// Mocked so importing sync.ts never builds the real DB client.
vi.mock("@/src/prisma/activities", () => ({
  upsertActivityFromStrava: vi.fn(),
}));

const upsert = vi.mocked(upsertActivityFromStrava);
const USER_ID = "user-1" as UserId;
const AFTER = 1_700_000_000;

let nextId = 1;
function activities(count: number): SummaryActivity[] {
  return Array.from(
    { length: count },
    () => ({ id: nextId++, start_latlng: [49.28, -123.12] }) as SummaryActivity,
  );
}

// Cast because the package types start_latlng as a tuple or null, but the
// real API sends [] for activities without GPS.
function withLatlng(latlng: unknown): SummaryActivity {
  return { id: nextId++, start_latlng: latlng } as unknown as SummaryActivity;
}

// Returns each page in turn, then empty pages if asked for more.
function fakeClient(pages: SummaryActivity[][]) {
  const listActivities = vi.fn(
    async ({ page }: { page: number }) => pages[page - 1] ?? [],
  );
  const client = {
    athlete: { listActivities },
  } as unknown as StravaClientInstance;
  return { client, listActivities };
}

beforeEach(() => {
  nextId = 1;
  upsert.mockReset();
  upsert.mockResolvedValue(undefined);
});

describe("syncActivities", () => {
  it("stops immediately when the first page is empty", async () => {
    const { client, listActivities } = fakeClient([[]]);

    await syncActivities(client, USER_ID, AFTER);

    expect(listActivities).toHaveBeenCalledTimes(1);
    expect(listActivities).toHaveBeenCalledWith({
      after: AFTER,
      page: 1,
      per_page: 100,
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("fetches a single short page and upserts each activity", async () => {
    const page = activities(3);
    const { client, listActivities } = fakeClient([page]);

    await syncActivities(client, USER_ID, AFTER);

    expect(listActivities).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(3);
    for (const activity of page) {
      expect(upsert).toHaveBeenCalledWith(USER_ID, activity);
    }
  });

  it("keeps paging until it gets a short page", async () => {
    const pages = [activities(100), activities(100), activities(42)];
    const { client, listActivities } = fakeClient(pages);

    await syncActivities(client, USER_ID, AFTER);

    expect(listActivities.mock.calls.map(([args]) => args)).toEqual([
      { after: AFTER, page: 1, per_page: 100 },
      { after: AFTER, page: 2, per_page: 100 },
      { after: AFTER, page: 3, per_page: 100 },
    ]);
    expect(upsert).toHaveBeenCalledTimes(242);
    expect(upsert.mock.calls.map(([, activity]) => activity)).toEqual(
      pages.flat(),
    );
  });

  it("asks for one more page when the last full page happens to be the end", async () => {
    const pages = [activities(100)];
    const { client, listActivities } = fakeClient(pages);

    await syncActivities(client, USER_ID, AFTER);

    expect(listActivities).toHaveBeenCalledTimes(2);
    expect(listActivities).toHaveBeenLastCalledWith({
      after: AFTER,
      page: 2,
      per_page: 100,
    });
    expect(upsert).toHaveBeenCalledTimes(100);
  });

  it("propagates upsert failures without fetching further pages", async () => {
    const { client, listActivities } = fakeClient([
      activities(100),
      activities(1),
    ]);
    upsert.mockRejectedValueOnce(new Error("db down"));

    await expect(syncActivities(client, USER_ID, AFTER)).rejects.toThrow(
      "db down",
    );
    expect(listActivities).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("skips activities without a start location", async () => {
    const [withLocation] = activities(1);
    const page = [
      withLatlng([]),
      withLatlng(null),
      { id: nextId++ } as SummaryActivity,
      withLocation,
    ];
    const { client } = fakeClient([page]);

    await syncActivities(client, USER_ID, AFTER);

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(USER_ID, withLocation);
  });

  it("keeps paging after a full page even when some activities were skipped", async () => {
    const firstPage = [
      ...activities(90),
      ...Array.from({ length: 10 }, () => withLatlng([])),
    ];
    const secondPage = activities(5);
    const { client, listActivities } = fakeClient([firstPage, secondPage]);

    await syncActivities(client, USER_ID, AFTER);

    expect(listActivities).toHaveBeenCalledTimes(2);
    expect(listActivities).toHaveBeenLastCalledWith({
      after: AFTER,
      page: 2,
      per_page: 100,
    });
    expect(upsert).toHaveBeenCalledTimes(95);
  });
});

describe("hasStartLocation", () => {
  it.each([
    ["an empty array", []],
    ["null", null],
    ["undefined", undefined],
    ["a single number", [49.28]],
    ["non-finite numbers", [Number.NaN, -123.12]],
    ["non-numeric values", ["49.28", "-123.12"]],
  ])("is false for %s", (_label, latlng) => {
    expect(
      hasStartLocation({ start_latlng: latlng } as unknown as SummaryActivity),
    ).toBe(false);
  });

  it("is false when start_latlng is missing", () => {
    expect(hasStartLocation({} as SummaryActivity)).toBe(false);
  });

  it("is true for a lat/lng pair", () => {
    expect(hasStartLocation({ start_latlng: [49.28, -123.12] })).toBe(true);
  });

  it("accepts coordinates of zero", () => {
    expect(hasStartLocation({ start_latlng: [0, 0] })).toBe(true);
  });
});
