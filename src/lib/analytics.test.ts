import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseClientId,
  parseSessionId,
  sendGaEvent,
  SESSION_COOKIE_NAME,
} from "./analytics";

describe("parseClientId", () => {
  it("takes the client id from the _ga cookie", () => {
    expect(parseClientId("GA1.1.123456789.1727700000")).toBe(
      "123456789.1727700000",
    );
    expect(parseClientId("GA1.2.987.654")).toBe("987.654");
  });

  it("returns null for a missing or unexpected cookie", () => {
    expect(parseClientId(undefined)).toBeNull();
    expect(parseClientId("not-a-ga-cookie")).toBeNull();
  });
});

describe("parseSessionId", () => {
  it("reads both session cookie formats", () => {
    expect(parseSessionId("GS1.1.1727700000.3.1.1727700100.0.0.0")).toBe(
      "1727700000",
    );
    expect(parseSessionId("GS2.1.s1727700000$o3$g1$t1727700100$j60$l0$h0")).toBe(
      "1727700000",
    );
  });

  it("returns null when there's no usable session", () => {
    expect(parseSessionId(undefined)).toBeNull();
    expect(parseSessionId("garbage")).toBeNull();
  });
});

describe("sendGaEvent", () => {
  const cookies = (values: Record<string, string>) => ({
    get: (name: string) =>
      name in values ? { value: values[name] } : undefined,
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does nothing outside the live site", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("GA_API_SECRET", "secret");

    await sendGaEvent(cookies({}), "sign_up");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the event with the visitor's client and session ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("GA_API_SECRET", "secret");

    await sendGaEvent(
      cookies({
        _ga: "GA1.1.123.456",
        [SESSION_COOKIE_NAME]: "GS2.1.s1727700000$o3",
      }),
      "sign_up",
      { method: "Strava" },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("measurement_id=G-62WW2T3NZH");
    expect(url).toContain("api_secret=secret");
    expect(JSON.parse(init.body)).toEqual({
      client_id: "123.456",
      events: [
        {
          name: "sign_up",
          params: {
            method: "Strava",
            session_id: "1727700000",
            engagement_time_msec: 1,
          },
        },
      ],
    });
  });

  it("never throws when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("GA_API_SECRET", "secret");

    await expect(sendGaEvent(cookies({}), "login")).resolves.toBeUndefined();
  });
});
