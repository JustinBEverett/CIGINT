import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { describeStravaError } from "@/src/lib/strava/error";
import type { GraphQLContext } from "./context";
import { resolvers } from "./resolvers";
import { typeDefs } from "./schema";

export function createServer() {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    formatError: (formattedError, error) => {
      // Query mistakes (bad syntax, unknown field, wrong argument type) are
      // the caller's to see and carry nothing sensitive.
      const original = unwrapResolverError(error);
      if (original === error) return formattedError;

      // A failure inside a resolver may be a strava-v3 error, which embeds
      // the Authorization header and sometimes the client secret. Log only
      // the summary and send the client a message of ours.
      const summary = describeStravaError(original);
      console.error("GraphQL resolver failed", summary);

      return {
        message: "Request to Strava failed",
        locations: formattedError.locations,
        path: formattedError.path,
        extensions: {
          code: "UPSTREAM_ERROR",
          ...(summary.statusCode && { status: summary.statusCode }),
        },
      };
    },
  });
}
