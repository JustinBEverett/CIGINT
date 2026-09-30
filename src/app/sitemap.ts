import type { MetadataRoute } from "next";

// The pages anyone can visit. Keep in step with the proxy's public paths.
const PUBLIC_PAGES = ["/", "/about", "/demo", "/privacy"];

// Served at /sitemap.xml.
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  return PUBLIC_PAGES.map((path) => ({ url: new URL(path, origin).toString() }));
}
