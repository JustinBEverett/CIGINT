"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const INTERVAL_MS = 4000;
const MAX_REFRESHES = 10;

// Air quality is looked up a few activities per request, so a fresh import
// fills in over several renders. Re-render the server component until it's
// done, but give up eventually rather than hammering a lookup that keeps failing.
export default function AutoRefresh() {
  const router = useRouter();
  const count = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (count.current >= MAX_REFRESHES) {
        clearInterval(timer);
        return;
      }
      count.current += 1;
      router.refresh();
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [router]);

  return null;
}
