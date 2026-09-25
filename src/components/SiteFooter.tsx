import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200">
      <div className="mx-auto flex max-w-xl flex-col gap-1 p-4 text-xs text-gray-500">
        <p>
          <a
            href="https://www.strava.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Powered by Strava
          </a>
          {" · "}
          Air quality data from Environment and Climate Change Canada (RDAQA)
        </p>
        <p>
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          {" · "}A rough estimate for fun, not medical advice.
        </p>
      </div>
    </footer>
  );
}
