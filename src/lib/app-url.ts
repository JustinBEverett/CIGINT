// Absolute URL on this deployment. APP_ORIGIN is set per environment
// (localhost locally, the real domain in Vercel).
export function appUrl(path: string): URL {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("Missing APP_ORIGIN in the environment");
  return new URL(path, origin);
}
