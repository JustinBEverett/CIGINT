// Berkeley Earth's rule of thumb: breathing 22 µg/m³ of PM2.5 for 24 hours
// is roughly the dose of smoking one cigarette.
const UG_HOURS_PER_M3_PER_CIGARETTE = 22 * 24;

// Elapsed time includes stops, which still count as exposure, unless the
// activity was mostly standing around (elapsed > 1.5x moving time). In that
// case moving time is the better estimate of time actually spent outside.
const MAX_ELAPSED_TO_MOVING_RATIO = 1.5;

export interface CigaretteInput {
  pm25: number | null;
  elapsedTime: number;
  movingTime: number;
}

export function exposureSeconds({
  elapsedTime,
  movingTime,
}: Pick<CigaretteInput, "elapsedTime" | "movingTime">): number {
  return elapsedTime > movingTime * MAX_ELAPSED_TO_MOVING_RATIO
    ? movingTime
    : elapsedTime;
}

export function cigarettesFor(input: CigaretteInput): number | null {
  if (input.pm25 == null) return null;

  const hours = exposureSeconds(input) / 3600;
  return (input.pm25 * hours) / UG_HOURS_PER_M3_PER_CIGARETTE;
}

export function formatCigarettes(value: number): string {
  return value < 0.01 ? "<0.01" : value.toFixed(2);
}
