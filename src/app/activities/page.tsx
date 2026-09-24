import { getSession } from "@/src/lib/session";
import { getAthleteActivities } from "@/src/lib/strava/query";

export default async function ActivitiesPage() {
  const strava = await getSession();

  if (strava) {
    const activities = await getAthleteActivities(strava);

    return (
      <ol>
        {activities.length &&
          activities.map((activity) => (
            <li key={activity.id}>
              <h2>{activity.name}</h2>
              <pre>{JSON.stringify(activity, null, 2)}</pre>
            </li>
          ))}
      </ol>
    );
  }
}
