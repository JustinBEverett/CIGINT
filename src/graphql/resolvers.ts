import { cigarettesFor } from "@/src/lib/airquality/cigarettes";
import { describeStravaError } from "@/src/lib/strava/error";
import { getActivitiesForUser } from "@/src/prisma/activities";
import { getAthleteProfile, getLastSyncedAt } from "@/src/prisma/users";
import type { GraphQLContext } from "./context";
import {
  toActivity,
  toAirQuality,
  toAthlete,
  toStoredActivity,
  type Activity,
} from "./mappers";

interface ActivitiesArgs {
  after?: number | null;
  before?: number | null;
  page: number;
  perPage: number;
}

export const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, { strava }: GraphQLContext) =>
      toAthlete(await strava.athlete.get()),

    // Everything here comes from our database, scoped to the session's user.
    feed: async (
      _parent: unknown,
      _args: unknown,
      { userId }: GraphQLContext,
    ) => {
      const [profile, activities, lastSyncedAt] = await Promise.all([
        getAthleteProfile(userId),
        getActivitiesForUser(userId),
        getLastSyncedAt(userId),
      ]);
      return {
        profile: profile ?? null,
        activities: activities.map(toStoredActivity),
        lastSyncedAt,
      };
    },

    activities: async (
      _parent: unknown,
      { after, before, page, perPage }: ActivitiesArgs,
      { strava }: GraphQLContext,
    ) => {
      // Strava's query string only gets the filters that were actually set.
      const activities = await strava.athlete.listActivities({
        page,
        per_page: perPage,
        ...(after != null && { after }),
        ...(before != null && { before }),
      });
      return activities.map(toActivity);
    },

    activity: async (
      _parent: unknown,
      { id }: { id: string },
      { strava }: GraphQLContext,
    ) => {
      try {
        return toActivity(await strava.activities.get({ id }));
      } catch (error) {
        // The schema promises null for an activity that doesn't exist or
        // isn't the athlete's; any other failure is a real error.
        if (describeStravaError(error).statusCode === 404) return null;
        throw error;
      }
    },
  },

  // Fields resolved on top of the Strava data. `activity` is what the
  // Query resolvers above returned. Both fields wait on the same loader key,
  // so asking for both costs one lookup.
  Activity: {
    airQuality: async (
      activity: Activity,
      _args: unknown,
      { loaders }: GraphQLContext,
    ) => {
      const reading = await loaders.airQuality.load(activity.id);
      return reading && toAirQuality(reading);
    },

    cigarettes: async (
      activity: Activity,
      _args: unknown,
      { loaders }: GraphQLContext,
    ) => {
      const reading = await loaders.airQuality.load(activity.id);
      return cigarettesFor({
        pm25: reading?.pm25 ?? null,
        elapsedTime: activity.elapsedTime,
        movingTime: activity.movingTime,
      });
    },
  },
};
