// Google Analytics: the browser tag (see the root layout) and server-side
// events sent with GA4's Measurement Protocol.

export const GA_MEASUREMENT_ID = "G-62WW2T3NZH";

// Analytics only runs on the live site. Vercel sets VERCEL_ENV to
// "production" there, and to "preview" or nothing everywhere else, so local
// dev and preview deploys never count as visits.
export function isLiveSite(): boolean {
  return process.env.VERCEL_ENV === "production";
}

// The gtag script stores its client id in the `_ga` cookie, e.g.
// "GA1.1.123456789.1727700000" → "123456789.1727700000".
export function parseClientId(gaCookie: string | undefined): string | null {
  const match = gaCookie?.match(/^GA\d+\.\d+\.(\d+\.\d+)$/);
  return match ? match[1] : null;
}

// The session cookie (`_ga_<id without "G-">`) holds the current session
// id. Two formats are in use: "GS1.1.1727700000.3.1…" (id is the 3rd field)
// and "GS2.1.s1727700000$o3$g1…" (id follows "s" in the 3rd field).
export function parseSessionId(
  sessionCookie: string | undefined,
): string | null {
  const field = sessionCookie?.split(".")[2];
  const match = field?.match(/^s?(\d+)/);
  return match ? match[1] : null;
}

export const SESSION_COOKIE_NAME = `_ga_${GA_MEASUREMENT_ID.replace(/^G-/, "")}`;

interface CookieReader {
  get(name: string): { value: string } | undefined;
}

// Sends one event from the server, tied to the visitor's browser session
// through their GA cookies so reports credit the right traffic source.
// Never throws: analytics must not break whatever called it. Run it inside
// `after()` so the response isn't held up.
export async function sendGaEvent(
  cookies: CookieReader,
  name: string,
  params: Record<string, string | number> = {},
): Promise<void> {
  const apiSecret = process.env.GA_API_SECRET;
  if (!isLiveSite() || !apiSecret) return;

  // Without a _ga cookie (e.g. an ad blocker stopped the tag), a random id
  // still counts the event, just not linked to earlier page views.
  const clientId =
    parseClientId(cookies.get("_ga")?.value) ?? crypto.randomUUID();
  const sessionId = parseSessionId(cookies.get(SESSION_COOKIE_NAME)?.value);

  const url =
    "https://www.google-analytics.com/mp/collect" +
    `?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${encodeURIComponent(apiSecret)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name,
            params: {
              ...params,
              ...(sessionId && { session_id: sessionId }),
              // Without it GA doesn't count the event towards engagement.
              engagement_time_msec: 1,
            },
          },
        ],
      }),
    });
    if (!response.ok) {
      console.error(`GA event "${name}" failed: ${response.status}`);
    }
  } catch (error) {
    console.error(
      `GA event "${name}" failed:`,
      error instanceof Error ? error.message : error,
    );
  }
}
