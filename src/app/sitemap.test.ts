import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sitemap", () => {
  it("lists the public pages as absolute URLs on this site", () => {
    vi.stubEnv("APP_ORIGIN", "https://cigint.example");

    expect(sitemap().map((entry) => entry.url)).toEqual([
      "https://cigint.example/",
      "https://cigint.example/about",
      "https://cigint.example/demo",
      "https://cigint.example/privacy",
    ]);
  });
});

describe("robots", () => {
  it("keeps crawlers out of signed-in pages and points at the sitemap", () => {
    vi.stubEnv("APP_ORIGIN", "https://cigint.example");
    const result = robots();

    expect(result.rules).toEqual({
      userAgent: "*",
      disallow: ["/activities", "/account", "/api/"],
    });
    expect(result.sitemap).toBe("https://cigint.example/sitemap.xml");
  });
});
