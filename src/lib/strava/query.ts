import { StravaClientInstance } from "strava-v3";

export function getAthleteActivities(client: StravaClientInstance) {
  return client.athlete.listActivities();
}
