export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Privacy</h1>

      <h2 className="text-lg font-semibold">What we store</h2>
      <ul className="list-disc space-y-1 pl-5 text-gray-700">
        <li>Your Strava name and profile photo URL.</li>
        <li>The Strava access and refresh tokens used to read your activities.</li>
        <li>
          A summary of each outdoor activity from the last 30 days: name, type, start
          time and location, distance, duration, heart rate, and the air quality
          readings we looked up for it.
        </li>
        <li>A random session identifier that keeps you logged in (a cookie).</li>
      </ul>

      <h2 className="text-lg font-semibold">What we don&apos;t do</h2>
      <p className="text-gray-700">
        We never see your Strava password, share your data with anyone, or use
        it for advertising. Your data is only shown to you.
      </p>

      <h2 className="text-lg font-semibold">Deleting your data</h2>
      <p className="text-gray-700">
        Use <strong>Disconnect Strava and delete my data</strong> on the Account
        page. It revokes access on Strava and permanently deletes everything
        listed above. You can also revoke cigint any time from Strava&apos;s
        settings under My Apps.
      </p>
    </main>
  );
}
