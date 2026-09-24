import { randomUUID } from "node:crypto";
import { db } from "./db.ts";

export type UserId = NonNullable<
  Awaited<ReturnType<typeof db.orm.public.User.first>>
>["id"];

const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
const PROVIDER_STRAVA = "strava";

export interface StravaTokenFields {
  athleteId: string;
  firstName?: string;
  lastName?: string;
  profileMedium?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export interface StravaCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Links (or creates) the User behind a Strava account, upserts that
// account's tokens, and opens a new session for it. One call covers both
// first-time login and reconnecting an already-linked account.
export async function loginWithStrava(fields: StravaTokenFields): Promise<{
  userId: UserId;
  sessionToken: string;
}> {
  const expiresAtIso = new Date(fields.expiresAt * 1000).toISOString();

  const existingAccount = await db.orm.public.Account.select("userId")
    .where({ provider: PROVIDER_STRAVA, providerAccountId: fields.athleteId })
    .first();

  const profile = {
    firstName: fields.firstName,
    lastName: fields.lastName,
    profileMedium: fields.profileMedium,
  };

  let userId: UserId;
  if (existingAccount) {
    userId = existingAccount.userId;
    await db.orm.public.User.where({ id: userId }).update(profile);
  } else {
    userId = (await db.orm.public.User.create(profile)).id;
  }

  await db.orm.public.Account.upsert({
    conflictOn: { provider: PROVIDER_STRAVA, providerAccountId: fields.athleteId },
    create: {
      userId,
      provider: PROVIDER_STRAVA,
      providerAccountId: fields.athleteId,
      accessToken: fields.accessToken,
      refreshToken: fields.refreshToken,
      expiresAt: expiresAtIso,
      scope: fields.scope,
    },
    update: {
      accessToken: fields.accessToken,
      refreshToken: fields.refreshToken,
      expiresAt: expiresAtIso,
      scope: fields.scope,
    },
  });

  const sessionToken = await createSession(userId);
  return { userId, sessionToken };
}

async function createSession(userId: UserId): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(
    Date.now() + SESSION_LIFETIME_SECONDS * 1000,
  ).toISOString();

  await db.orm.public.Session.create({ userId, token, expiresAt });
  return token;
}

// Resolves a session cookie's token to the user it belongs to, or null if
// the token is unknown or has expired.
export async function getUserIdForSessionToken(
  token: string,
): Promise<UserId | null> {
  const session = await db.orm.public.Session.select("userId", "expiresAt")
    .where({ token })
    .first();

  if (!session || new Date(session.expiresAt).valueOf() < Date.now()) {
    return null;
  }

  return session.userId;
}

export async function getStravaCredentials(
  userId: UserId,
): Promise<StravaCredentials | null> {
  const account = await db.orm.public.Account.select(
    "accessToken",
    "refreshToken",
    "expiresAt",
  )
    .where({ userId, provider: PROVIDER_STRAVA })
    .first();

  if (
    !account ||
    account.accessToken == null ||
    account.refreshToken == null ||
    account.expiresAt == null
  ) {
    return null;
  }

  return {
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    expiresAt: account.expiresAt,
  };
}

export async function updateStravaToken(
  userId: UserId,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
): Promise<void> {
  const expiresAtIso = new Date(expiresAt * 1000).toISOString();

  await db.orm.public.Account.where({
    userId,
    provider: PROVIDER_STRAVA,
  }).update({
    accessToken,
    refreshToken,
    expiresAt: expiresAtIso,
  });
}

export async function getLastSyncedAt(userId: UserId): Promise<string | null> {
  const row = await db.orm.public.User.select("lastSyncedAt")
    .where({ id: userId })
    .first();
  return row?.lastSyncedAt ?? null;
}

export async function updateLastSyncedAt(userId: UserId): Promise<void> {
  await db.orm.public.User.where({ id: userId }).update({
    lastSyncedAt: new Date().toISOString(),
  });
}

export async function getAthleteProfile(userId: UserId) {
  return db.orm.public.User.select("firstName", "lastName", "profileMedium")
    .where({ id: userId })
    .first();
}
