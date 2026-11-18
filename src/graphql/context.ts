import type { StravaClientInstance } from "strava-v3";

// Built once per request and handed to every resolver. Resolvers get the
// Strava client from here instead of importing one, so each request uses its
// own athlete's token and tests can pass in a fake.
export interface GraphQLContext {
  strava: StravaClientInstance;
}
