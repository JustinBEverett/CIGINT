import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SCREENSHOT_HEADER } from "./lib/constants";
import { proxy } from "./proxy";

const BASE = "http://localhost:3000";

function request(path: string, cookies: Record<string, string> = {}) {
  const headers = new Headers();
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookieHeader) headers.set("cookie", cookieHeader);
  return new NextRequest(new URL(path, BASE), { headers });
}

// NextResponse.next() marks pass-through with this header; redirects carry a
// Location header instead.
function passedThrough(response: Response) {
  return response.headers.get("x-middleware-next") === "1";
}

describe("proxy", () => {
  it.each([
    "/",
    "/demo",
    "/privacy",
    "/api/strava/authorize",
    "/api/strava/callback",
    "/api/auth/logout",
  ])("lets %s through without a session", (path) => {
    const response = proxy(request(path));

    expect(passedThrough(response)).toBe(true);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets query strings on the OAuth callback through", () => {
    const response = proxy(
      request("/api/strava/callback?code=abc&state=xyz"),
    );

    expect(passedThrough(response)).toBe(true);
  });

  it.each(["/activities", "/account", "/api/account/delete"])(
    "redirects %s to Strava authorization without a session",
    (path) => {
      const response = proxy(request(path));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `${BASE}/api/strava/authorize`,
      );
      expect(passedThrough(response)).toBe(false);
    },
  );

  it("ignores unrelated cookies", () => {
    const response = proxy(request("/activities", { other: "1" }));

    expect(response.headers.get("location")).toBe(
      `${BASE}/api/strava/authorize`,
    );
  });

  it.each(["/activities", "/account"])(
    "lets %s through with a session cookie",
    (path) => {
      const response = proxy(request(path, { cigint_session: "token" }));

      expect(passedThrough(response)).toBe(true);
      expect(response.headers.get("location")).toBeNull();
    },
  );
});

describe("proxy screenshot mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // NextResponse.next({ request: { headers } }) passes request header
  // overrides to Next as x-middleware-request-* response headers.
  function markedAsScreenshot(response: Response) {
    return (
      response.headers.get(`x-middleware-request-${SCREENSHOT_HEADER}`) === "1"
    );
  }

  it("marks /demo?screenshot when screenshots are enabled", () => {
    vi.stubEnv("DEMO_SCREENSHOT", "1");
    const response = proxy(request("/demo?screenshot"));

    expect(passedThrough(response)).toBe(true);
    expect(markedAsScreenshot(response)).toBe(true);
  });

  it("does nothing without the env switch", () => {
    vi.stubEnv("DEMO_SCREENSHOT", "");
    expect(markedAsScreenshot(proxy(request("/demo?screenshot")))).toBe(false);
  });

  it("only marks the demo page", () => {
    vi.stubEnv("DEMO_SCREENSHOT", "1");
    expect(markedAsScreenshot(proxy(request("/demo")))).toBe(false);
    expect(
      markedAsScreenshot(proxy(request("/activities?screenshot"))),
    ).toBe(false);
  });
});
