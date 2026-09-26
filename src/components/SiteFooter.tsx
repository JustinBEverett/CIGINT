import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200">
      <div className="mx-auto flex max-w-xl flex-col gap-1 p-4 text-xs text-gray-500">
        <p>
          <a
            href="https://www.justineverett.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Built by Justin Everett
          </a>
          {" · "}
          Credit where credit&apos;s due.
        </p>
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
        <p className="self-center text-center mt-8">
          Don&apos;t hack darts, hack the planet. 🌎
        </p>
      </div>
    </footer>
  );
}
