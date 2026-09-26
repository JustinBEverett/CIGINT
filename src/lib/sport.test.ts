import {
  BicycleIcon,
  PersonSimpleHikeIcon,
  PersonSimpleRunIcon,
  PulseIcon,
} from "@phosphor-icons/react/dist/ssr";
import { describe, expect, it } from "vitest";
import { sportFor } from "./sport";

describe("sportFor", () => {
  it("maps a known sport type to its label and icon", () => {
    expect(sportFor("TrailRun", "Run")).toEqual({
      label: "Trail run",
      Icon: PersonSimpleRunIcon,
    });
  });

  it("groups related sport types onto one icon", () => {
    expect(sportFor("GravelRide", "Ride").Icon).toBe(BicycleIcon);
    expect(sportFor("EMountainBikeRide", "EBikeRide").Icon).toBe(BicycleIcon);
  });

  it("falls back to the legacy type when sportType is missing", () => {
    expect(sportFor(null, "Hike")).toEqual({
      label: "Hike",
      Icon: PersonSimpleHikeIcon,
    });
    expect(sportFor(undefined, "Ride").Icon).toBe(BicycleIcon);
    expect(sportFor("", "Run").Icon).toBe(PersonSimpleRunIcon);
  });

  it("gives an unknown type the generic icon and a readable label", () => {
    expect(sportFor("PaddleTennis", "Workout")).toEqual({
      label: "Paddle tennis",
      Icon: PulseIcon,
    });
  });

  it.each([
    ["TrailRun", "Trail run"],
    ["EBikeRide", "E-bike ride"],
    ["EMountainBikeRide", "E-mountain bike ride"],
    ["MountainBikeRide", "Mountain bike ride"],
    ["StandUpPaddling", "Stand up paddling"],
    ["Run", "Run"],
  ])("labels %s as %s", (type, label) => {
    expect(sportFor(type, "Workout").label).toBe(label);
  });
});
