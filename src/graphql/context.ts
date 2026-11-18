import type { StravaClientInstance } from "strava-v3";
import type { UserId } from "@/src/prisma/users";
import type { Loaders } from "./loaders";

// Built once per request and handed to every resolver. Resolvers get the
// Strava client from here instead of importing one, so each request uses its
// own athlete's token and tests can pass in a fake.
export interface GraphQLContext {
  strava: StravaClientInstance;
  // Whose data the request is for. Stored activities and air-quality
  // readings are looked up by this, never by an id the caller supplies.
  userId: UserId;
  // Batching and per-request caching for stored data (see loaders.ts).
  loaders: Loaders;
}
