import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [`process.env.APP_ORIGIN`],
};

export default nextConfig;
