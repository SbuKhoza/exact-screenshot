import { createServerFn } from "@tanstack/react-start";

/**
 * Public, read-only: returns the Firebase web API key.
 * Firebase web API keys are publishable identifiers (restricted by HTTP
 * referrer in Google Cloud / Firebase Auth authorized domains), not secrets.
 */
export const getFirebaseApiKey = createServerFn({ method: "GET" }).handler(async () => {
  return process.env["GOOGLE_API_KEY"] ?? null;
});
