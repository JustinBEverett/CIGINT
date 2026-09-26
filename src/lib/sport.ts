import type { Icon } from "@phosphor-icons/react";
import {
  BicycleIcon,
  BoatIcon,
  GolfIcon,
  MountainsIcon,
  PersonSimpleHikeIcon,
  PersonSimpleRunIcon,
  PersonSimpleSkiIcon,
  PersonSimpleSnowboardIcon,
  PersonSimpleSwimIcon,
  PersonSimpleWalkIcon,
  PulseIcon,
  SailboatIcon,
  SneakerMoveIcon,
  SnowflakeIcon,
  WavesIcon,
  WheelchairMotionIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { SportType } from "strava-v3";

export type Sport = { label: string; Icon: Icon };

// Phosphor has no icon for most individual sports, so similar ones share one.
// Keys are Strava sport types; legacy activity types are a subset of these
// names, so the same table covers both.
const ICON_GROUPS: [Icon, SportType[]][] = [
  [PersonSimpleRunIcon, ["Run", "TrailRun", "VirtualRun"]],
  [PersonSimpleWalkIcon, ["Walk"]],
  [PersonSimpleHikeIcon, ["Hike"]],
  [
    BicycleIcon,
    [
      "Ride",
      "GravelRide",
      "MountainBikeRide",
      "EBikeRide",
      "EMountainBikeRide",
      "VirtualRide",
      "Velomobile",
      "Handcycle",
    ],
  ],
  [PersonSimpleSwimIcon, ["Swim"]],
  [PersonSimpleSkiIcon, ["AlpineSki", "BackcountrySki", "NordicSki", "RollerSki"]],
  [PersonSimpleSnowboardIcon, ["Snowboard"]],
  [SnowflakeIcon, ["Snowshoe", "IceSkate"]],
  [SneakerMoveIcon, ["InlineSkate", "Skateboard"]],
  [
    BoatIcon,
    ["Rowing", "VirtualRow", "Canoeing", "Kayaking", "StandUpPaddling"],
  ],
  [WavesIcon, ["Surfing", "Kitesurf", "Windsurf"]],
  [SailboatIcon, ["Sail"]],
  [MountainsIcon, ["RockClimbing"]],
  [GolfIcon, ["Golf"]],
  [WheelchairMotionIcon, ["Wheelchair"]],
];

const ICONS = new Map<string, Icon>(
  ICON_GROUPS.flatMap(([icon, types]) => types.map((t) => [t, icon] as const)),
);

// "TrailRun" -> "Trail run", "EBikeRide" -> "E-bike ride". A lone capital
// before another word is a prefix like the "E" in e-bike, so it gets a hyphen
// instead of a space.
function labelFor(type: string): string {
  const words = type
    .split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/)
    .map((w, i) => (i === 0 ? w : w.toLowerCase()));
  return words.reduce(
    (label, word, i) =>
      i === 0 ? word : label + (words[i - 1].length === 1 ? "-" : " ") + word,
    "",
  );
}

// Activities without a stored sportType fall back to Strava's older, coarser
// activity type, which still names most sports ("Run", "Ride", "Hike").
export function sportFor(
  sportType: string | null | undefined,
  legacyType: string,
): Sport {
  const type = sportType || legacyType;
  return { label: labelFor(type), Icon: ICONS.get(type) ?? PulseIcon };
}
