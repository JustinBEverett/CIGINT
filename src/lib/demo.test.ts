import { describe, expect, it } from "vitest";
import { aqhiRisk } from "./airquality/aqhi";
import { demoFeed, screenshotMode } from "./demo";

const NOW = Date.parse("2026-09-29T18:00:00Z");

describe("demoFeed", () => {
  const feed = demoFeed(NOW);

  it("places every activity in the past, newest first", () => {
    const starts = feed.activities.map((a) => Date.parse(a.startDate));
    expect(starts.every((start) => start < NOW)).toBe(true);
    expect([...starts].sort((a, b) => b - a)).toEqual(starts);
  });

  it("gives every activity a reading and a place name", () => {
    for (const activity of feed.activities) {
      expect(feed.readings.get(activity.id)?.aqhi).toBeTypeOf("number");
      expect(feed.locations.get(activity.id)).toBeTruthy();
    }
  });

  it("covers a preliminary reading and more than one risk band", () => {
    const readings = [...feed.readings.values()];
    expect(readings.some((r) => r.status === "prelim")).toBe(true);
    const bands = new Set(readings.map((r) => aqhiRisk(r.aqhi!)));
    expect(bands.size).toBeGreaterThan(1);
  });
});

describe("screenshotMode", () => {
  const env = {
    DEMO_SCREENSHOT: "1",
    DEMO_SCREENSHOT_NAME: "Jordan Hale",
    DEMO_SCREENSHOT_AVATAR_URL: "https://example.com/avatar.jpg",
  };

  it("is off without the env switch, whatever the URL says", () => {
    expect(screenshotMode({}, { screenshot: "" })).toBeNull();
    expect(
      screenshotMode({ ...env, DEMO_SCREENSHOT: undefined }, { screenshot: "" }),
    ).toBeNull();
  });

  it("is off without the URL parameter", () => {
    expect(screenshotMode(env, {})).toBeNull();
  });

  it("uses the configured name and photo when both are present", () => {
    expect(screenshotMode(env, { screenshot: "" })).toEqual({
      athlete: {
        firstName: "Jordan",
        lastName: "Hale",
        profileMedium: "https://example.com/avatar.jpg",
      },
    });
  });

  it("falls back to the demo athlete's monogram", () => {
    expect(
      screenshotMode({ DEMO_SCREENSHOT: "1" }, { screenshot: "1" }),
    ).toEqual({
      athlete: { firstName: "Demo", lastName: "Athlete", profileMedium: null },
    });
  });
});
