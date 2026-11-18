import type { GraphQLContext } from "./context";
import { toActivity, toAthlete } from "./mappers";
import { describeStravaError } from "@/src/lib/strava/error";

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
};
