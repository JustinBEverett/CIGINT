"use client";

import { useSyncExternalStore } from "react";
import { formatActivityDate } from "@/src/lib/format-date";

const noopSubscribe = () => () => {};

// The server only knows UTC, so "today" and "yesterday" are worked out in the
// browser's time zone. The server renders an empty placeholder and the label
// appears on hydration, which avoids a server/client text mismatch.
export default function ActivityDate({ startDate }: { startDate: string }) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const start = new Date(startDate);

  return (
    <time dateTime={start.toISOString()} className="min-h-4">
      {isClient ? formatActivityDate(start, new Date()) : " "}
    </time>
  );
}
