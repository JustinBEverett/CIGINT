import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/src/components/SiteFooter";
import SiteHeader from "@/src/components/SiteHeader";

export const metadata: Metadata = {
  title: "CIGINT",
  description:
    "See how many cigarettes your Strava activities were worth, based on local air quality.",
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
