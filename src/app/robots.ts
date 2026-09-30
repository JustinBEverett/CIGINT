import type { MetadataRoute } from "next";

// Served at /robots.txt. The signed-in pages and API routes only ever
// redirect a crawler to Strava's login, so keep crawlers out of them.
export default function robots(): MetadataRoute.Robots {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      disallow: ["/activities", "/account", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", origin).toString(),
  };
}
