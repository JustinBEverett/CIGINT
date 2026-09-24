import { getActivities } from "@/src/lib/activities";

export default async function ActivitiesPage() {
  const activities = await getActivities();

  return (
    <ol>
      {activities.map((activity) => (
        <li key={activity.id}>
          <h2>{activity.name}</h2>
          <pre>{JSON.stringify(activity, null, 2)}</pre>
        </li>
      ))}
    </ol>
  );
}
