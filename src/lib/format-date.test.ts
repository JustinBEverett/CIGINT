import { describe, expect, it } from "vitest";
import { formatActivityDate } from "./format-date";

const VANCOUVER = "America/Vancouver";
const TORONTO = "America/Toronto";

describe("formatActivityDate", () => {
  // 01:01 UTC on the 25th is 6:01 p.m. on the 24th in Vancouver (PDT).
  const start = new Date("2026-09-25T01:01:00Z");
  const now = new Date("2026-09-25T20:00:00Z");

  it("uses the viewer's calendar day, not UTC's", () => {
    expect(formatActivityDate(start, now, VANCOUVER)).toMatch(/^Yesterday at 6:01/);
    expect(formatActivityDate(start, now, "UTC")).toMatch(/^Today at 1:01/);
  });

  it("says Today for an activity earlier the same local day", () => {
    const morning = new Date("2026-09-25T14:00:00Z");
    expect(formatActivityDate(morning, now, VANCOUVER)).toMatch(/^Today at 7:00/);
  });

  it("shows the date for anything older than yesterday", () => {
    const older = new Date("2026-09-22T18:30:00Z");
    expect(formatActivityDate(older, now, VANCOUVER)).toMatch(/^Sep 22 at 11:30/);
  });

  it("handles the local day rolling over before UTC's", () => {
    // 11:30 p.m. on the 24th in Toronto, viewed just after local midnight.
    const lateNight = new Date("2026-09-25T03:30:00Z");
    const justAfterMidnight = new Date("2026-09-25T04:05:00Z");
    expect(formatActivityDate(lateNight, justAfterMidnight, TORONTO)).toMatch(
      /^Yesterday at 11:30/,
    );
  });
});
