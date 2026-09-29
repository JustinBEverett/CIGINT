import {
  BicycleIcon,
  BootIcon,
  FootprintsIcon,
  PersonSimpleRunIcon,
  PulseIcon,
  SneakerIcon,
  SneakerMoveIcon,
} from "@phosphor-icons/react/dist/ssr";
import { describe, expect, it } from "vitest";
import { sportFor } from "./sport";

describe("sportFor", () => {
  it("maps a known sport type to its label and icon", () => {
    expect(sportFor("TrailRun", "Run")).toEqual({
      label: "Trail run",
      Icon: SneakerIcon,
    });
  });

  it("groups related sport types onto one icon", () => {
    expect(sportFor("GravelRide", "Ride").Icon).toBe(BicycleIcon);
    expect(sportFor("EMountainBikeRide", "EBikeRide").Icon).toBe(BicycleIcon);
    expect(sportFor("Skateboard", "Workout").Icon).toBe(SneakerMoveIcon);
  });

  it("gives running variants and walking their own icons", () => {
    expect(sportFor("Run", "Run").Icon).toBe(SneakerMoveIcon);
    expect(sportFor("TrailRun", "Run").Icon).toBe(SneakerIcon);
    expect(sportFor("VirtualRun", "Run").Icon).toBe(PersonSimpleRunIcon);
    expect(sportFor("Walk", "Walk").Icon).toBe(FootprintsIcon);
  });

  it("falls back to the legacy type when sportType is missing", () => {
    expect(sportFor(null, "Hike")).toEqual({
      label: "Hike",
      Icon: BootIcon,
    });
    expect(sportFor(undefined, "Ride").Icon).toBe(BicycleIcon);
    expect(sportFor("", "Run").Icon).toBe(SneakerMoveIcon);
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
