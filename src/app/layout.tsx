import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cigint",
  description: "See how many cigarettes your Strava activities were worth, based on local air quality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
