import type { ReactNode } from "react";
import { useTenant } from "@/lib/tenant-context";
import { SiteContentProvider } from "@/lib/site-content";
import { SuspendedPage } from "./suspended-page";

function Screen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {children ? <div className="mt-2 text-sm text-muted-foreground">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * Decides what the visitor sees based on the tenant's status in the CMS.
 * Fails closed: nothing from the site renders until the tenant is confirmed active.
 */
export function TenantGate({ children }: { children: ReactNode }) {
  const { status, tenant, error } = useTenant();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (status === "suspended") {
    const reason = typeof tenant?.suspensionReason === "string" ? tenant.suspensionReason : undefined;
    return <SuspendedPage businessName={tenant?.businessName} reason={reason} />;
  }

  if (status === "not_found") {
    return (
      <Screen title="Site not found">
        <p>This address is not connected to a website. If you own it, check that the domain is added in the CMS.</p>
        {error ? <p className="mt-3 break-words rounded-md bg-muted/50 px-3 py-2 text-xs">{error}</p> : null}
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen title="We can't load this site right now">
        <p>Please check your connection and try again.</p>
        {error ? <p className="mt-3 break-words rounded-md bg-muted/50 px-3 py-2 text-xs">{error}</p> : null}
        <button
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </Screen>
    );
  }

  return <SiteContentProvider>{children}</SiteContentProvider>;
}