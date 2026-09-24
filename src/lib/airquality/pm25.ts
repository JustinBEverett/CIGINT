import {
  decodeFieldValues,
  nearestGridpoint,
  parseFields,
  parseGrid,
  splitMessages,
} from "@azohra/meteo.grib";
import { decodeJ2k } from "@azohra/meteo.j2k";

export interface Pm25Query {
  lat: number;
  lng: number;
  date: Date | string;
}

// How far back the datamart keeps files: it holds 30 date folders, and the
// oldest one only covers valid times from its own date forward.
export const RDAQA_RETENTION_DAYS = 29;

const HOUR_MS = 60 * 60 * 1000;

// The grid is 10km, so a nearest point much farther than that means the
// activity is outside ECCC's coverage rather than a legitimate reading.
const MAX_GRIDPOINT_DISTANCE_KM = 15;

// ECCC publishes one RDAQA surface PM2.5 analysis (10km grid) per valid hour.
// The 22Z and 23Z files are filed under the *next* day's folder, so the
// folder date is the valid time + 2h rather than the valid date itself.
function rdaqaUrl(date: Date): string {
  const validIso = date.toISOString();
  const validDay = validIso.slice(0, 10).replaceAll("-", "");
  const hour = validIso.slice(11, 13);
  const folderDay = new Date(date.getTime() + 2 * HOUR_MS)
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");
  return `https://dd.weather.gc.ca/${folderDay}/WXO-DD/model_rdaqa/10km/${hour}/${validDay}T${hour}Z_MSC_RDAQA_PM2.5_Sfc_RLatLon0.09_PT0H.grib2`;
}

// Returns µg/m³. null means ECCC has no reading for that hour/place. Network and decode
// failures throw instead, so a transient error isn't mistaken for "no data".
export async function getPm25({ lat, lng, date }: Pm25Query) {
  const response = await fetch(rdaqaUrl(new Date(date)));

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch RDAQA GRIB2: ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const [field] = parseFields(splitMessages(bytes)[0]);
  const grid = parseGrid(field.section3);
  const { values } = decodeFieldValues(field, { decodeJ2k });
  const site = nearestGridpoint(grid, lat, lng);
  if (site.distanceKm > MAX_GRIDPOINT_DISTANCE_KM) return null;

  // GRIB2 stores this as mass density in kg/m³; convert to µg/m³.
  const value = values[site.index] * 1e9;
  return Number.isFinite(value) ? value : null;
}
