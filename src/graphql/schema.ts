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

  # Whether a reading is final, still preliminary (overwritten once ECCC
  # publishes the final analysis), or could not be made (no GPS, or outside
  # ECCC's coverage).
  enum AirQualityStatus {
    PRELIM
    FINAL
    UNAVAILABLE
  }

  # Health Canada's risk bands for the AQHI.
  enum AqhiRisk {
    LOW
    MODERATE
    HIGH
    VERY_HIGH
  }

  # Air quality at an activity's start location, averaged over the 3 hours
  # ending at its start hour (the window the AQHI is defined on). The
  # pollutant fields are null when status is UNAVAILABLE.
  type AirQuality {
    status: AirQualityStatus!
    windowStart: String
    windowEnd: String
    # Fine particulate matter, µg/m³.
    pm25: Float
    # Nitrogen dioxide and ozone, ppb.
    no2: Float
    o3: Float
    # Air Quality Health Index, unrounded. Health Canada publishes it as a
    # whole number from 1 up, shown as "10+" above 10.
    aqhi: Float
    aqhiRisk: AqhiRisk
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

    # Null when no reading exists yet or the lookup failed; a reading that
    # was attempted but isn't possible has status UNAVAILABLE instead.
    airQuality: AirQuality
    # Cigarettes' worth of PM2.5 breathed during the activity. Null without
    # a PM2.5 reading.
    cigarettes: Float
  }

  type Athlete {
    id: ID!
    firstName: String
    lastName: String
    profileMedium: String
  }

  # The athlete's name and picture as stored when they signed in. Unlike
  # Athlete (read live from Strava) this needs no Strava request.
  type Profile {
    firstName: String
    lastName: String
    profileMedium: String
  }

  # What CIGINT already holds for the signed-in user, read from our own
  # database without asking Strava.
  type Feed {
    profile: Profile
    # Stored activities, newest first. Only activities with a start location
    # are stored, since those are the ones air quality can be looked up for.
    # Activity.map is always null here: routes aren't stored.
    activities: [Activity!]!
    # When Strava was last asked for new activities; null before the first sync.
    lastSyncedAt: String
  }

  type Mutation {
    # Fetches new activities from Strava into our database and returns the
    # ones that weren't stored before. Returns an empty list without asking
    # Strava if the last sync was recent, since Strava's rate limits are shared
    # across all users. Unlike a page load, a Strava failure is an error here.
    syncActivities: [Activity!]!
  }

  type Query {
    # The signed-in athlete.
    me: Athlete!

    # The signed-in user's stored data. Prefer this to activities when the
    # data is already stored: it costs no Strava rate limit.
    feed: Feed!

    # A page of the athlete's activities, newest first, except that Strava
    # returns them oldest first whenever after is set. after and before are
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
