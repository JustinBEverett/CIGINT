import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6 text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900">Privacy</h1>
      <p className="text-sm text-gray-500">Last updated September 30, 2026.</p>

      <h2 className="text-lg font-semibold text-gray-900">What we store</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Your Strava name and profile photo URL.</li>
        <li>The Strava access and refresh tokens used to read your activities.</li>
        <li>
          A summary of each outdoor activity from the last 30 days: name, sport
          type, start time and location, distance, duration, heart rate, the
          place name we looked up for it, and its air quality readings.
        </li>
        <li>A random session identifier that keeps you logged in (a cookie).</li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-900">
        Who else sees what
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>OpenStreetMap:</strong> to name the place where an activity
          started, we send the start point, rounded to about 100 m, to{" "}
          <ExternalLink href="https://operations.osmfoundation.org/policies/nominatim/">
            OpenStreetMap&apos;s Nominatim service
          </ExternalLink>
          . Nothing else about you or the activity is sent.
        </li>
        <li>
          <strong>Google Analytics:</strong> we use{" "}
          <ExternalLink href="https://policies.google.com/technologies/partner-sites">
            Google Analytics
          </ExternalLink>{" "}
          to count visits and see which pages are used. It sets cookies and
          sends Google information such as the pages you view, your browser and
          device, and your approximate location. It doesn&apos;t receive your
          Strava data. You can block it with a browser extension or
          Google&apos;s{" "}
          <ExternalLink href="https://tools.google.com/dlpage/gaoptout">
            opt-out add-on
          </ExternalLink>
          .
        </li>
        <li>
          <strong>Vercel Web Analytics:</strong> our host,{" "}
          <ExternalLink href="https://vercel.com/docs/analytics/privacy-policy">
            Vercel
          </ExternalLink>
          , also counts page views. It doesn&apos;t use cookies. It records
          the page, the site you came from, and your country, browser and
          device type, but not who you are, and it doesn&apos;t receive your
          Strava data.
        </li>
        <li>
          <strong>Strava:</strong> under its API agreement, Strava may collect
          information about how CIGINT uses the Strava API, and may use it for
          its own purposes.
        </li>
        <li>
          <strong>Air quality data:</strong> we download public files from
          Environment and Climate Change Canada. Nothing about you is sent to
          them.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-gray-900">
        What we don&apos;t do
      </h2>
      <p>
        We never see your Strava password, and we don&apos;t sell your data or
        use it for advertising. Your Strava data is only shown to you.
      </p>

      <h2 className="text-lg font-semibold text-gray-900">
        Deleting your data
      </h2>
      <p>
        Use <strong>Disconnect Strava and delete my data</strong> on the Account
        page. It revokes access on Strava and permanently deletes everything
        listed under &quot;What we store&quot;. You can also revoke CIGINT any
        time from Strava&apos;s settings under My Apps.
      </p>
    </main>
  );
}
