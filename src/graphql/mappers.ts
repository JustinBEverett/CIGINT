import type { SummaryActivity, SummaryAthlete } from "strava-v3";

// Pure conversions from Strava's REST objects to the shapes in schema.ts.
// Kept free of imports from the DB or session code so they can be tested on
// their own.

// Strava's HR fields aren't declared on this package's SummaryActivity type
// even though the real API returns them (present only when the athlete
// recorded heart rate).
type StravaActivity = SummaryActivity & {
  average_heartrate?: number;
  max_heartrate?: number;
};

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  sportType: string | null;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  startDate: string;
  startLocation: LatLng | null;
  map: { summaryPolyline: string | null } | null;
  averageHeartrate: number | null;
  maxHeartrate: number | null;
}

export interface Athlete {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileMedium: string | null;
}

// The package types start_latlng as a tuple or null, but the real API sends
// [] for activities without GPS, so check the shape rather than trusting the
// type.
export function toLatLng(latlng: unknown): LatLng | null {
  if (!Array.isArray(latlng) || latlng.length < 2) return null;

  const [lat, lng] = latlng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function toActivity(activity: StravaActivity): Activity {
  return {
    id: String(activity.id),
    name: activity.name,
    type: activity.type,
    sportType: activity.sport_type ?? null,
    distance: activity.distance,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    startDate: activity.start_date,
    startLocation: toLatLng(activity.start_latlng),
    map: activity.map
      ? { summaryPolyline: activity.map.summary_polyline || null }
      : null,
    averageHeartrate: activity.average_heartrate ?? null,
    maxHeartrate: activity.max_heartrate ?? null,
  };
}

export function toAthlete(athlete: SummaryAthlete): Athlete {
  return {
    id: String(athlete.id),
    firstName: athlete.firstname || null,
    lastName: athlete.lastname || null,
    profileMedium: athlete.profile_medium || null,
  };
}
