export interface AqhiInput {
  // 3-hour averages: NO₂ and O₃ in ppb, PM2.5 in µg/m³.
  no2: number;
  o3: number;
  pm25: number;
}

// Health Canada's Air Quality Health Index (Stieb et al. 2008).
export function computeAqhi({ no2, o3, pm25 }: AqhiInput): number {
  return (
    (1000 / 10.4) *
    (Math.exp(0.000871 * no2) -
      1 +
      (Math.exp(0.000537 * o3) - 1) +
      (Math.exp(0.000487 * pm25) - 1))
  );
}

export type AqhiRisk = "Low" | "Moderate" | "High" | "Very high";

// The AQHI is published as a whole number from 1 up, with anything above 10
// shown as "10+".
function reportedAqhi(aqhi: number): number {
  return Math.max(1, Math.round(aqhi));
}

export function formatAqhi(aqhi: number): string {
  const value = reportedAqhi(aqhi);
  return value > 10 ? "10+" : String(value);
}

export function aqhiRisk(aqhi: number): AqhiRisk {
  const value = reportedAqhi(aqhi);
  if (value <= 3) return "Low";
  if (value <= 6) return "Moderate";
  if (value <= 10) return "High";
  return "Very high";
}
