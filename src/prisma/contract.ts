import { defineContract } from "@prisma/orm-postgres/contract-builder";

export const contract = defineContract({}, ({ field, model, rel }) => {
  const User = model("User", {
    fields: {
      id: field.id.uuidv7String(),
      firstName: field.text().optional(),
      lastName: field.text().optional(),
      createdAt: field.temporal.createdAtString(),
      updatedAt: field.temporal.updatedAtString(),
      stravaAthleteId: field.text().optional().unique(),
      stravaAccessToken: field.text().optional(),
      stravaRefreshToken: field.text().optional(),
      stravaExpiresAt: field.temporal.timestamptzString().optional(),
      stravaScope: field.text().optional(),
      sessionId: field.text().unique().optional(),
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
      }),
      Activity: Activity.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
      }),
    },
  };
});
