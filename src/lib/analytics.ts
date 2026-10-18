import { getAnalyticsId } from "./analytics.functions";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

/** Load gtag.js once and configure GA4. Safe to call multiple times. */
export async function initAnalytics(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const measurementId = await getAnalyticsId();
    if (!measurementId) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  } catch {
    // Analytics is best-effort; never break the app over it.
  }
}

/** Send a SPA page_view for client-side route changes. */
export function trackPageView(path: string): void {
  window.gtag?.("event", "page_view", { page_path: path });
}
