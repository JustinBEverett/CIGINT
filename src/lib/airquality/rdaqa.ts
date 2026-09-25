import {
  decodeFieldValues,
  ECCODES_MISSING_VALUE,
  nearestGridpoint,
  parseFields,
  parseGrid,
  splitMessages,
  type Grid,
} from "@azohra/meteo.grib";
import { decodeJ2k } from "@azohra/meteo.j2k";
import { computeAqhi } from "./aqhi";

// ECCC's Regional Deterministic Air Quality Analysis: hourly surface
// analyses on a 10km grid covering Canada and the contiguous US.
export const RDAQA_SOURCE = "ECCC RDAQA";

// The datamart keeps 30 date folders, and the oldest only covers valid times
// from its own date forward.
export const RDAQA_RETENTION_DAYS = 29;

export type Pollutant = "PM2.5" | "NO2" | "O3";
export type Product = "prelim" | "final";

const POLLUTANTS: Pollutant[] = ["PM2.5", "NO2", "O3"];
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Observed on the datamart: the prelim analysis for valid hour H appears at
// about H:43 and the final one at about H+2:08. Padded a little so we don't
// ask for a file moments before it lands.
const PUBLISH_DELAY_MS: Record<Product, number> = {
  prelim: 50 * MINUTE_MS,
  final: 2 * HOUR_MS + 15 * MINUTE_MS,
};

// AQHI is defined on 3-hour averages.
const WINDOW_HOURS = 3;

// The grid is 10km, so a nearest point much farther than that means the
// location is outside coverage rather than a legitimate reading.
const MAX_GRIDPOINT_DISTANCE_KM = 15;

export function floorToHour(date: Date): Date {
  return new Date(Math.floor(date.getTime() / HOUR_MS) * HOUR_MS);
}

export function isPublished(product: Product, validHour: Date, now: Date) {
  return now.getTime() >= validHour.getTime() + PUBLISH_DELAY_MS[product];
}

export function latestPublishedHour(product: Product, now: Date): Date {
  return floorToHour(new Date(now.getTime() - PUBLISH_DELAY_MS[product]));
}

const yyyymmdd = (date: Date) =>
  date.toISOString().slice(0, 10).replaceAll("-", "");

// Files live under the UTC date they were published, not the date of the
// hour they describe. Prelims publish within the hour, so that's always the
// valid date; finals publish ~2h later, which puts 22Z and 23Z under the
// next day's folder.
export function rdaqaUrl(
  product: Product,
  pollutant: Pollutant,
  validHour: Date,
): string {
  const hour = validHour.toISOString().slice(11, 13);
  const folderDay =
    product === "final"
      ? yyyymmdd(new Date(validHour.getTime() + 2 * HOUR_MS))
      : yyyymmdd(validHour);
  const name = product === "final" ? "RDAQA" : "RDAQA-Prelim";
  return `https://dd.weather.gc.ca/${folderDay}/WXO-DD/model_rdaqa/10km/${hour}/${yyyymmdd(validHour)}T${hour}Z_MSC_${name}_${pollutant}_Sfc_RLatLon0.09_PT0H.grib2`;
}

interface DecodedGrid {
  grid: Grid;
  values: ArrayLike<number>;
}

// Shared by every lookup in one request. Concurrent requests for the same
// file share a single download, downloads are capped so a first import
// doesn't open dozens of connections to ECCC at once, and only a few decoded
// grids (~3.5 MB each) are kept in memory. Across requests, the raw files
// come from Next's fetch cache: a published file never changes.
export class GridLoader {
  private pending = new Map<string, Promise<DecodedGrid | null>>();
  private decoded = new Map<string, DecodedGrid | null>();
  private active = 0;
  private waiting: (() => void)[] = [];

  constructor(
    private maxConcurrentDownloads = 6,
    private maxDecodedGrids = 12,
  ) {}

  load(url: string): Promise<DecodedGrid | null> {
    if (this.decoded.has(url)) {
      const grid = this.decoded.get(url)!;
      this.decoded.delete(url);
      this.decoded.set(url, grid);
      return Promise.resolve(grid);
    }

    let promise = this.pending.get(url);
    if (!promise) {
      promise = this.withSlot(() => fetchGrid(url))
        .then((grid) => {
          this.remember(url, grid);
          return grid;
        })
        .finally(() => this.pending.delete(url));
      this.pending.set(url, promise);
    }
    return promise;
  }

  private remember(url: string, grid: DecodedGrid | null) {
    this.decoded.set(url, grid);
    if (this.decoded.size > this.maxDecodedGrids) {
      const oldest = this.decoded.keys().next().value!;
      this.decoded.delete(oldest);
    }
  }

  private async withSlot<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrentDownloads) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    this.active++;
    try {
      return await task();
    } finally {
      this.active--;
      this.waiting.shift()?.();
    }
  }
}

// null means the file isn't there (not published yet, or aged out).
async function fetchGrid(url: string): Promise<DecodedGrid | null> {
  const response = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: false },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const [field] = parseFields(splitMessages(bytes)[0]);
  return {
    grid: parseGrid(field.section3),
    values: decodeFieldValues(field, { decodeJ2k }).values,
  };
}

// Returns µg/m³ for PM2.5 (stored as kg/m³) or ppb for NO₂/O₃ (stored as a
// mol/mol mixing ratio) — both are a factor of 1e9. null when the point is
// outside the grid's coverage or masked as missing.
function sample(
  { grid, values }: DecodedGrid,
  lat: number,
  lng: number,
): number | null {
  const site = nearestGridpoint(grid, lat, lng);
  if (site.distanceKm > MAX_GRIDPOINT_DISTANCE_KM) return null;

  const raw = values[site.index];
  if (raw === ECCODES_MISSING_VALUE || !Number.isFinite(raw)) return null;
  return raw * 1e9;
}

export type AirQualityResult =
  | { status: "unavailable" }
  | {
      status: Product;
      windowStart: Date;
      windowEnd: Date;
      pm25: number;
      no2: number;
      o3: number;
      aqhi: number;
    };

type WindowResult = AirQualityResult | "missing-files";

async function readWindow(
  loader: GridLoader,
  product: Product,
  windowEnd: Date,
  lat: number,
  lng: number,
): Promise<WindowResult> {
  const hours = Array.from(
    { length: WINDOW_HOURS },
    (_, i) => new Date(windowEnd.getTime() - (WINDOW_HOURS - 1 - i) * HOUR_MS),
  );

  const grids = await Promise.all(
    POLLUTANTS.map((pollutant) =>
      Promise.all(
        hours.map((hour) => loader.load(rdaqaUrl(product, pollutant, hour))),
      ),
    ),
  );
  if (grids.flat().some((grid) => grid === null)) return "missing-files";

  const averages = grids.map((hourlyGrids) => {
    const samples = hourlyGrids.map((grid) => sample(grid!, lat, lng));
    if (samples.some((value) => value === null)) return null;
    return (samples as number[]).reduce((sum, v) => sum + v, 0) / samples.length;
  });
  if (averages.some((value) => value === null)) return { status: "unavailable" };

  const [pm25, no2, o3] = averages as number[];
  return {
    status: product,
    windowStart: hours[0],
    windowEnd,
    pm25,
    no2,
    o3,
    aqhi: computeAqhi({ pm25, no2, o3 }),
  };
}

export interface AirQualityQuery {
  lat: number | null;
  lng: number | null;
  startDate: Date | string;
}

// Air quality for the 3 hours ending at the activity's start hour: the final
// analysis if it's out, otherwise the prelim. An activity newer than the
// latest prelim gets the most recent prelim window instead, so there is
// always something to show; it's upgraded later (see needsLookup).
//
// Returns null when the files it needs aren't published yet — worth trying
// again later, unlike "unavailable", which is definitive.
export async function lookupAirQuality(
  { lat, lng, startDate }: AirQualityQuery,
  loader: GridLoader,
  now: Date = new Date(),
): Promise<AirQualityResult | null> {
  if (lat == null || lng == null) return { status: "unavailable" };

  const target = floorToHour(new Date(startDate));
  const windowStart = new Date(target.getTime() - (WINDOW_HOURS - 1) * HOUR_MS);
  if (now.getTime() - windowStart.getTime() > RDAQA_RETENTION_DAYS * DAY_MS) {
    return { status: "unavailable" };
  }

  if (isPublished("final", target, now)) {
    const final = await readWindow(loader, "final", target, lat, lng);
    if (final !== "missing-files") return final;
  }

  const latestPrelim = latestPublishedHour("prelim", now);
  const prelimEnd = latestPrelim < target ? latestPrelim : target;

  // A publication running late can leave the newest hour missing for a few
  // minutes; one hour earlier is still a good stand-in.
  for (const hoursBack of [0, 1]) {
    const end = new Date(prelimEnd.getTime() - hoursBack * HOUR_MS);
    const prelim = await readWindow(loader, "prelim", end, lat, lng);
    if (prelim !== "missing-files") return prelim;
  }

  return null;
}

export interface StoredReading {
  status: string;
  windowEnd: string | null;
}

// Whether an activity's stored reading could be improved by looking again:
// never looked up, a prelim whose final is now out, or a stand-in prelim
// (from before the activity's own hour was published) that has a newer
// window available.
export function needsLookup(
  reading: StoredReading | undefined,
  startDate: Date | string,
  now: Date = new Date(),
): boolean {
  if (!reading) return true;
  if (reading.status !== "prelim") return false;

  const target = floorToHour(new Date(startDate));
  if (isPublished("final", target, now)) return true;

  if (!reading.windowEnd) return true;
  const windowEnd = new Date(reading.windowEnd);
  return (
    windowEnd < target && latestPublishedHour("prelim", now) > windowEnd
  );
}
