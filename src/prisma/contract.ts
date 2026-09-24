import { defineContract } from "@prisma/orm-postgres/contract-builder";

export const contract = defineContract({}, ({ field, model, rel }) => {
  const User = model("User", {
    fields: {
      id: field.id.uuidv7String(),
      firstName: field.text().optional(),
      lastName: field.text().optional(),
      createdAt: field.temporal.createdAtString(),
      updatedAt: field.temporal.updatedAtString(),
      lastSyncedAt: field.temporal.timestamptzString().optional(),
    },
  });

  // One row per linked auth provider per user. Strava today; a second
  // provider (another OAuth, or a password credential) is a new row here,
  // not a new column on User.
  const Account = model("Account", {
    fields: {
      id: field.id.uuidv7String(),
      userId: field.uuidString(),
      provider: field.text(),
      providerAccountId: field.text(),
      accessToken: field.text().optional(),
      refreshToken: field.text().optional(),
      expiresAt: field.temporal.timestamptzString().optional(),
      scope: field.text().optional(),
      createdAt: field.temporal.createdAtString(),
      updatedAt: field.temporal.updatedAtString(),
    },
  }).attributes(({ fields, constraints }) => ({
    uniques: [constraints.unique([fields.provider, fields.providerAccountId])],
  }));

  // One row per active session (device/browser), independent of User so a
  // login on one device doesn't invalidate another, and so a session can
  // carry its own expiry and be revoked individually.
  const Session = model("Session", {
    fields: {
      id: field.id.uuidv7String(),
      userId: field.uuidString(),
      token: field.text().unique(),
      expiresAt: field.temporal.timestamptzString(),
      createdAt: field.temporal.createdAtString(),
    },
  });

  const Activity = model("Activity", {
    fields: {
      id: field.id.uuidv7String(),
      userId: field.uuidString(),
      stravaActivityId: field.text().unique(),
      name: field.text(),
      type: field.text(),
      startDate: field.temporal.timestamptzString(),
      movingTime: field.int(),
      elapsedTime: field.int(),
      distance: field.float(),
      startLat: field.float().optional(),
      startLng: field.float().optional(),
      averageHeartrate: field.float().optional(),
      maxHeartrate: field.float().optional(),
      createdAt: field.temporal.createdAtString(),
    },
  });

  return {
    models: {
      User: User.relations({
        activities: rel.hasMany(Activity, { by: "userId" }),
        accounts: rel.hasMany(Account, { by: "userId" }),
        sessions: rel.hasMany(Session, { by: "userId" }),
      }),
      Activity: Activity.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
      }),
      Account: Account.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
      }),
      Session: Session.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
      }),
    },
  };
});
