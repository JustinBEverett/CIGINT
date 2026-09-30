import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/src/components/SiteFooter";
import SiteHeader from "@/src/components/SiteHeader";

const TITLE_PREFIX = process.env.NODE_ENV === "development" ? "[DEV] " : "";
const SITE_TITLE = "CIGINT | Smoke the competition 💨";
const DESCRIPTION =
  "See how many cigarettes your Strava activities were worth, based on local air quality.";

export const metadata: Metadata = {
  // Makes the link preview image's URL absolute. Falls back to localhost
  // where APP_ORIGIN isn't set, e.g. CI builds.
  metadataBase: new URL(process.env.APP_ORIGIN ?? "http://localhost:3000"),
  // Pages set a plain name ("About"); the home page has none.
  title: {
    default: `${TITLE_PREFIX}${SITE_TITLE}`,
    template: `${TITLE_PREFIX}%s – ${SITE_TITLE}`,
  },
  description: DESCRIPTION,
  // The image comes from opengraph-image.png beside this file.
  openGraph: {
    type: "website",
    siteName: "CIGINT",
    title: "CIGINT – Smoke the competition",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
