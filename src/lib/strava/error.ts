// strava-v3's errors carry the whole request they came from: the
// Authorization header, and for token calls the refresh token and client
// secret, plus the raw HTTP response. Logging one directly writes those
// credentials to the server logs, so log this summary instead.
export interface StravaErrorSummary {
  name: string;
  message: string;
  // Present when Strava responded; absent for network failures.
  statusCode?: number;
  // Strava's error body, e.g. { message, errors: [{ resource, field, code }] }.
  body?: unknown;
}

export function describeStravaError(error: unknown): StravaErrorSummary {
  if (!(error instanceof Error)) {
    return { name: "UnknownError", message: String(error) };
  }

  const summary: StravaErrorSummary = {
    name: error.name,
    message: error.message,
  };
  if ("statusCode" in error && typeof error.statusCode === "number") {
    summary.statusCode = error.statusCode;
  }
  if ("data" in error) {
    summary.body = error.data;
  }
  return summary;
}
