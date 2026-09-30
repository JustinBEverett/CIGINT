"use client";

import { sendGAEvent } from "@next/third-parties/google";

type ConnectButtonProps = {
  // Which page the click came from, for the analytics event.
  from: "home" | "account";
};

// A plain <a>, not Link: this is a route handler that redirects to
// strava.com, not a page to navigate to client-side. The click event is
// sent with the browser's beacon transport, so it survives the navigation;
// where the GA tag isn't loaded (dev, previews) it does nothing.
export default function ConnectButton({ from }: ConnectButtonProps) {
  return (
    <a
      href="/api/strava/authorize"
      onClick={() => sendGAEvent("event", "connect_strava_click", { from })}
      className="inline-block rounded bg-[#FC4C02] px-5 py-3 font-semibold text-white hover:bg-[#e04400]"
    >
      Connect with Strava
    </a>
  );
}
