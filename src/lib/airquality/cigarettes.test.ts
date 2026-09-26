import { describe, expect, it } from "vitest";
import {
  cigarettesFor,
  exposureSeconds,
  formatCigarettes,
} from "./cigarettes";

describe("exposureSeconds", () => {
  it("uses elapsed time when stops are a normal share of the activity", () => {
    expect(exposureSeconds({ elapsedTime: 4000, movingTime: 3600 })).toBe(4000);
  });

  it("still uses elapsed time at exactly 1.5x moving time", () => {
    expect(exposureSeconds({ elapsedTime: 5400, movingTime: 3600 })).toBe(5400);
  });

  it("falls back to moving time when elapsed is more than 1.5x moving", () => {
    expect(exposureSeconds({ elapsedTime: 5401, movingTime: 3600 })).toBe(3600);
  });
});

describe("cigarettesFor", () => {
  it("returns null when there is no PM2.5 reading", () => {
    expect(
      cigarettesFor({ pm25: null, elapsedTime: 3600, movingTime: 3600 }),
    ).toBeNull();
  });

  it("returns 0 for an activity with no duration", () => {
    expect(cigarettesFor({ pm25: 50, elapsedTime: 0, movingTime: 0 })).toBe(0);
  });

  it("returns 0 when PM2.5 is zero", () => {
    expect(
      cigarettesFor({ pm25: 0, elapsedTime: 3600, movingTime: 3600 }),
    ).toBe(0);
  });

  it("treats 22 µg/m³ for 24 hours as one cigarette", () => {
    const day = 24 * 3600;
    expect(
      cigarettesFor({ pm25: 22, elapsedTime: day, movingTime: day }),
    ).toBeCloseTo(1);
  });

  it("scales linearly with concentration and time", () => {
    // 44 µg/m³ for 6 hours is half the dose of 22 µg/m³ for 24 hours.
    const sixHours = 6 * 3600;
    expect(
      cigarettesFor({ pm25: 44, elapsedTime: sixHours, movingTime: sixHours }),
    ).toBeCloseTo(0.5);
  });

  it("uses moving time for the dose when the activity was mostly stopped", () => {
    const day = 24 * 3600;
    expect(
      cigarettesFor({ pm25: 22, elapsedTime: day * 2, movingTime: day }),
    ).toBeCloseTo(1);
  });
});

describe("formatCigarettes", () => {
  it("shows an exact zero as 0", () => {
    expect(formatCigarettes(0)).toBe("0");
  });

  it("shows <0.01 for small non-zero values", () => {
    expect(formatCigarettes(0.0001)).toBe("<0.01");
    expect(formatCigarettes(0.0099)).toBe("<0.01");
  });

  it("shows two decimals from 0.01 up", () => {
    expect(formatCigarettes(0.01)).toBe("0.01");
    expect(formatCigarettes(0.456)).toBe("0.46");
    expect(formatCigarettes(3)).toBe("3.00");
  });
});
