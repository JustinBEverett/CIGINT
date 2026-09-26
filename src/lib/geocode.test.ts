import { describe, expect, it } from "vitest";
import { formatPlace } from "./geocode";

describe("formatPlace", () => {
  it("combines the neighbourhood and the city", () => {
    expect(
      formatPlace({
        suburb: "Grandview-Woodland",
        city: "Vancouver",
        state: "British Columbia",
      }),
    ).toBe("Grandview-Woodland, Vancouver");
  });

  it("uses a town or village when there's no city", () => {
    expect(formatPlace({ town: "Lions Bay", state: "British Columbia" })).toBe(
      "Lions Bay",
    );
    expect(formatPlace({ village: "Tofino" })).toBe("Tofino");
  });

  it("doesn't repeat a name that is both the area and the place", () => {
    expect(formatPlace({ suburb: "Whistler", town: "Whistler" })).toBe(
      "Whistler",
    );
  });

  it("falls back to the area on its own", () => {
    expect(formatPlace({ hamlet: "Porteau", county: "Squamish-Lillooet" })).toBe(
      "Porteau",
    );
  });

  it("falls back to the region for remote spots", () => {
    expect(formatPlace({ county: "Squamish-Lillooet", state: "British Columbia" })).toBe(
      "Squamish-Lillooet",
    );
    expect(formatPlace({ state: "Northwest Territories" })).toBe(
      "Northwest Territories",
    );
  });

  it("returns null when there's nothing to go on", () => {
    expect(formatPlace({})).toBeNull();
  });
});
