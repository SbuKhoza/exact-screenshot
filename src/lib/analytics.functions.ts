import { createServerFn } from "@tanstack/react-start";

/** Public, read-only: returns the GA4 measurement ID (a public, non-secret value). */
export const getAnalyticsId = createServerFn({ method: "GET" }).handler(async () => {
  return process.env["GOOGLE_ANALYTICS_MEASUREMENT_ID"] ?? null;
});
