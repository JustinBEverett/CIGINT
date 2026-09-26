// Reverse geocoding via OpenStreetMap's Nominatim. Its usage policy asks for
// at most one request a second, an identifying User-Agent, and caching of
// results — which is why names are stored per activity and reused for
// nearby start points rather than looked up on every view.
// https://operations.osmfoundation.org/policies/nominatim/

const USER_AGENT = "cigint (+https://cigint.justineverett.ca)";
const MIN_INTERVAL_MS = 1100;

export interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  hamlet?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
}

// "Grandview-Woodland, Vancouver", "Lions Bay", or the region for rural
// spots with no settlement nearby.
export function formatPlace(address: NominatimAddress): string | null {
  const place =
    address.city ?? address.town ?? address.village ?? address.municipality;
  const area =
    address.suburb ?? address.neighbourhood ?? address.quarter ?? address.hamlet;

  if (place) return area && area !== place ? `${area}, ${place}` : place;
  if (area) return area;
  return address.county ?? address.state ?? null;
}

// Serialises requests within this server instance to respect the rate limit.
let queue: Promise<unknown> = Promise.resolve();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.then(
    () => sleep(MIN_INTERVAL_MS),
    () => sleep(MIN_INTERVAL_MS),
  );
  return run;
}

// null when there's nothing to call the spot (open water, say). Network and
// server errors throw, so a failure isn't mistaken for "no name".
export function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  return throttled(async () => {
    const url =
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14" +
      `&addressdetails=1&accept-language=en&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Nominatim reverse geocode failed: ${response.status}`);
    }

    const body = (await response.json()) as {
      error?: string;
      address?: NominatimAddress;
    };
    if (body.error || !body.address) return null;
    return formatPlace(body.address);
  });
}
