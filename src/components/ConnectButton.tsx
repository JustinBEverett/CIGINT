// A plain <a>, not Link: this is a route handler that redirects to
// strava.com, not a page to navigate to client-side.
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
