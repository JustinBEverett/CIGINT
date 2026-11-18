import type { StravaClientInstance } from "strava-v3";
import type { GridLoader } from "@/src/lib/airquality/rdaqa";
import type { UserId } from "@/src/prisma/users";

// Built once per request and handed to every resolver. Resolvers get the
// Strava client from here instead of importing one, so each request uses its
// own athlete's token and tests can pass in a fake.
export interface GraphQLContext {
  strava: StravaClientInstance;
  // Whose data the request is for. Stored activities and air-quality
  // readings are looked up by this, never by an id the caller supplies.
  userId: UserId;
  // Shared by every air-quality lookup in the request, so activities in the
  // same area and hour reuse one download. Per request rather than per
  // process: it holds decoded grids in memory.
  gridLoader: GridLoader;
}
