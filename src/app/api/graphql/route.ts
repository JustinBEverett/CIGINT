import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { GraphQLError } from "graphql";
import type { NextRequest } from "next/server";
import type { GraphQLContext } from "@/src/graphql/context";
import { createServer } from "@/src/graphql/server";
import { GridLoader } from "@/src/lib/airquality/rdaqa";
import { getSession } from "@/src/lib/session";

// getSession reads the session cookie, so the context is built per request
// and every resolver talks to Strava as the athlete making it.
const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(
  createServer(),
  {
    context: async () => {
      const session = await getSession();
      if (!session) {
        throw new GraphQLError("Not signed in", {
          extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
        });
      }
      return {
        strava: session.client,
        userId: session.userId,
        gridLoader: new GridLoader(),
      };
    },
  },
);

// Next passes a second argument (route params) that the integration's
// handler would take for a Node response, so call it with the request only.
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
