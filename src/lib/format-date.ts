const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar day number of an instant in the given time zone, so "today" and
// "yesterday" follow the viewer's midnight rather than UTC's.
function dayNumber(date: Date, timeZone?: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day")) / DAY_MS;
}

// "Today at 6:01 p.m.", "Yesterday at 7:15 a.m.", "Sep 23 at 12:30 p.m."
export function formatActivityDate(
  start: Date,
  now: Date,
  timeZone?: string,
): string {
  const time = start.toLocaleTimeString("en-CA", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });

  const daysAgo = dayNumber(now, timeZone) - dayNumber(start, timeZone);
  if (daysAgo === 0) return `Today at ${time}`;
  if (daysAgo === 1) return `Yesterday at ${time}`;

  const day = start.toLocaleDateString("en-CA", {
    timeZone,
    month: "short",
    day: "numeric",
  });
  return `${day} at ${time}`;
}
