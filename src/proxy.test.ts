import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "http://localhost:3000";

// constants.ts decides whether the dev bypass is on when it's first
// imported, so each test sets the env and then loads a fresh copy.
async function loadProxy() {
  vi.resetModules();
  const { proxy } = await import("./proxy");
  return proxy;
}

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

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy (no dev bypass)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEV_USER_ID", "");
  });

  it.each(["/", "/privacy", "/api/strava/authorize", "/api/strava/callback"])(
    "lets %s through without a session",
    async (path) => {
      const proxy = await loadProxy();
      const response = proxy(request(path));

      expect(passedThrough(response)).toBe(true);
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("lets query strings on the OAuth callback through", async () => {
    const proxy = await loadProxy();
    const response = proxy(
      request("/api/strava/callback?code=abc&state=xyz"),
    );

    expect(passedThrough(response)).toBe(true);
  });

  it.each(["/activities", "/account", "/api/account/delete"])(
    "redirects %s to Strava authorization without a session",
    async (path) => {
      const proxy = await loadProxy();
      const response = proxy(request(path));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `${BASE}/api/strava/authorize`,
      );
      expect(passedThrough(response)).toBe(false);
    },
  );

  it("ignores unrelated cookies", async () => {
    const proxy = await loadProxy();
    const response = proxy(request("/activities", { other: "1" }));

    expect(response.headers.get("location")).toBe(
      `${BASE}/api/strava/authorize`,
    );
  });

  it.each(["/activities", "/account"])(
    "lets %s through with a session cookie",
    async (path) => {
      const proxy = await loadProxy();
      const response = proxy(request(path, { cigint_session: "token" }));

      expect(passedThrough(response)).toBe(true);
      expect(response.headers.get("location")).toBeNull();
    },
  );
});

describe("dev bypass", () => {
  it("lets everything through outside production when DEV_USER_ID is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_USER_ID", "dev-user");

    const proxy = await loadProxy();
    const response = proxy(request("/activities"));

    expect(passedThrough(response)).toBe(true);
  });

  it("never activates in production, even with DEV_USER_ID set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_USER_ID", "dev-user");

    vi.resetModules();
    const { DEV_BYPASS_ACTIVE, DEV_USER_ID } = await import(
      "@/src/lib/constants"
    );
    expect(DEV_USER_ID).toBeUndefined();
    expect(DEV_BYPASS_ACTIVE).toBe(false);

    const proxy = await loadProxy();
    const response = proxy(request("/activities"));

    expect(response.headers.get("location")).toBe(
      `${BASE}/api/strava/authorize`,
    );
  });
});
