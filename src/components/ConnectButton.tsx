// A plain <a>, not <Link>: the target is an API route that redirects to
// Strava, and Link would prefetch it (setting the OAuth state cookie early).
export default function ConnectButton() {
  return (
    <a
      href="/api/strava/authorize"
      className="inline-block rounded bg-[#FC4C02] px-5 py-3 font-semibold text-white hover:bg-[#e04400]"
    >
      Connect with Strava
    </a>
  );
}
