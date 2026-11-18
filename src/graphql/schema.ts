// The GraphQL schema for CIGINT's API, in SDL. Strava's REST API uses
// snake_case and a few awkward shapes, so this exposes a camelCase version of
// only the parts CIGINT uses.
export const typeDefs = /* GraphQL */ `
  # Strava returns [lat, lng], or an empty array when there is no GPS. Named
  # fields are clearer, and "no GPS" becomes a null LatLng.
  type LatLng {
    lat: Float!
    lng: Float!
  }

  type ActivityMap {
    # Encoded polyline of the route, simplified by Strava.
    summaryPolyline: String
  }

  type Activity {
    # Strava's activity id. ID serialises as a string even though Strava's is
    # a number, so clients don't depend on the numeric form.
    id: ID!
    name: String!
    type: String!
    sportType: String
    # Metres.
    distance: Float!
    # Seconds.
    movingTime: Int!
    elapsedTime: Int!
    # ISO 8601.
    startDate: String!
    # Null when the activity has no GPS (e.g. a treadmill run).
    startLocation: LatLng
    map: ActivityMap
    # Beats per minute. Null without a heart-rate monitor.
    averageHeartrate: Float
    maxHeartrate: Float
  }

  type Athlete {
    id: ID!
    firstName: String
    lastName: String
    profileMedium: String
  }

  type Query {
    # The signed-in athlete.
    me: Athlete!

    # A page of the athlete's activities, newest first. after and before are
    # Unix timestamps (seconds) bounding the activity's start time.
    activities(
      after: Int
      before: Int
      page: Int = 1
      perPage: Int = 30
    ): [Activity!]!

    # Null if the activity doesn't exist or isn't the athlete's.
    activity(id: ID!): Activity
  }
`;
