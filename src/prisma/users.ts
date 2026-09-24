import { db } from "./db.ts";

export { db };

export interface StravaTokenFields {
  athleteId: string;
  firstName?: string;
  lastName?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}
export interface StravaCredentials {
  athleteId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export async function saveStravaToken(
  fields: StravaTokenFields,
  sessionId: string,
) {
  const expiresAtIso = new Date(fields.expiresAt * 1000).toISOString();

  return db.orm.public.User.upsert({
    conflictOn: { stravaAthleteId: fields.athleteId },
    create: {
      stravaAthleteId: fields.athleteId,
      firstName: fields.firstName,
      lastName: fields.lastName,
      stravaAccessToken: fields.accessToken,
      stravaRefreshToken: fields.refreshToken,
      stravaExpiresAt: expiresAtIso,
      stravaScope: fields.scope,
      sessionId: sessionId,
    },
    update: {
      stravaAccessToken: fields.accessToken,
      stravaRefreshToken: fields.refreshToken,
      stravaExpiresAt: expiresAtIso,
      sessionId: sessionId,
      ...(fields.scope != null ? { stravaScope: fields.scope } : {}),
      ...(fields.firstName != null ? { firstName: fields.firstName } : {}),
      ...(fields.lastName != null ? { lastName: fields.lastName } : {}),
    },
  });
}

export async function updateStravaToken(
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  sessionId: string,
) {
  const expiresAtIso = new Date(expiresAt * 1000).toISOString();

  return db.orm.public.User.where({ sessionId: sessionId }).update({
    stravaAccessToken: accessToken,
    stravaRefreshToken: refreshToken,
    stravaExpiresAt: expiresAtIso,
  });
}

export async function getStravaCredentials(
  sessionId: string,
): Promise<StravaCredentials | null> {
  const row = await db.orm.public.User.select(
    "stravaAccessToken",
    "stravaRefreshToken",
    "stravaExpiresAt",
    "stravaAthleteId",
  )
    .where({ sessionId: sessionId })
    .first();

  if (
    !row ||
    row.stravaAccessToken == null ||
    row.stravaRefreshToken == null ||
    row.stravaExpiresAt == null ||
    row.stravaAthleteId == null
  ) {
    return null;
  }

  return {
    athleteId: row.stravaAthleteId,
    accessToken: row.stravaAccessToken,
    refreshToken: row.stravaRefreshToken,
    expiresAt: row.stravaExpiresAt,
  };
}
