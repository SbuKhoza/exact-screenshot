import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { fb } from "./firebase";

/**
 * Multi-tenant detection for the public site.
 *
 * The CMS (cmshandybusiness) writes these Firestore documents:
 *   tenants/{tenantId}         -> { businessName, isActive, suspensionReason, ... }
 *   domains/{customDomain}     -> { domain, tenantId }
 *   subdomains/{subdomain}     -> { subdomain, tenantId }
 *
 * Resolution order:
 * 1. localhost / 127.0.0.1  -> localStorage "dev_tenant_id" (see setDevTenantId()).
 * 2. domains/{hostname}     (also tries the www / non-www variant).
 * 3. domains where domain == hostname (fallback for mappings saved with a different doc id).
 * 4. subdomains/{first label of hostname}.
 * 5. VITE_FALLBACK_TENANT_ID (optional) - handy for preview URLs that have no mapping.
 *
 * Only the tenant ID is cached (sessionStorage). The tenant's active/suspended status is
 * never cached, so a suspension takes effect immediately.
 */

const CACHE_KEY = "tenant_id";
const DEV_KEY = "dev_tenant_id";

let cached: string | null = null;

export function setDevTenantId(tenantId: string) {
  localStorage.setItem(DEV_KEY, tenantId);
  sessionStorage.removeItem(CACHE_KEY);
  cached = null;
}

export function clearCachedTenantId() {
  cached = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}

export function getCachedTenantId(): string | null {
  if (cached) return cached;
  try {
    return sessionStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function remember(tenantId: string): string {
  cached = tenantId;
  try {
    sessionStorage.setItem(CACHE_KEY, tenantId);
  } catch {
    /* sessionStorage unavailable */
  }
  return tenantId;
}

function hostnameVariants(hostname: string): string[] {
  const host = hostname.trim().toLowerCase();
  const bare = host.startsWith("www.") ? host.slice(4) : host;
  return Array.from(new Set([host, bare, `www.${bare}`]));
}

export async function detectTenantId(): Promise<string> {
  const fromCache = getCachedTenantId();
  if (fromCache) return (cached = fromCache);

  const hostname = window.location.hostname.toLowerCase();

  // 1. Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const devTenantId = localStorage.getItem(DEV_KEY);
    if (devTenantId) return remember(devTenantId);
    const envTenant = import.meta.env["VITE_FALLBACK_TENANT_ID"] as string | undefined;
    if (envTenant) return remember(envTenant);
    throw new Error(
      "No tenant ID for local development. Run setDevTenantId('<tenantId>') in the console once, or set VITE_FALLBACK_TENANT_ID.",
    );
  }

  const { db } = fb();
  const variants = hostnameVariants(hostname);

  // 2. Custom domain: domains/{hostname}
  for (const host of variants) {
    try {
      const snap = await getDoc(doc(db, "domains", host));
      if (snap.exists()) {
        const tenantId = snap.data()["tenantId"] as string | undefined;
        if (tenantId) return remember(tenantId);
      }
    } catch (e) {
      console.error("Error checking domain mapping:", e);
    }
  }

  // 3. Custom domain: query by field (in case the doc id differs from the domain)
  for (const host of variants) {
    try {
      const snap = await getDocs(
        query(collection(db, "domains"), where("domain", "==", host), limit(1)),
      );
      const tenantId = snap.docs[0]?.data()["tenantId"] as string | undefined;
      if (tenantId) return remember(tenantId);
    } catch (e) {
      console.error("Error querying domain mapping:", e);
    }
  }

  // 4. Subdomain: subdomains/{first label}
  const subdomain = hostname.split(".")[0];
  if (subdomain && subdomain !== hostname) {
    try {
      const subDoc = await getDoc(doc(db, "subdomains", subdomain));
      if (subDoc.exists()) {
        const tenantId = subDoc.data()["tenantId"] as string | undefined;
        if (tenantId) return remember(tenantId);
      }
    } catch (e) {
      console.error("Error checking subdomain mapping:", e);
    }
  }

  // 5. Optional fallback for unmapped preview hosts
  const fallback = import.meta.env["VITE_FALLBACK_TENANT_ID"] as string | undefined;
  if (fallback) return remember(fallback);

  throw new TenantNotFoundError(hostname);
}

export class TenantNotFoundError extends Error {
  constructor(public readonly hostname: string) {
    super(`Unable to detect tenant from domain: ${hostname}`);
    this.name = "TenantNotFoundError";
  }
}

export type Tenant = {
  id: string;
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  suspensionReason?: string;
  [k: string]: unknown;
};

/** A tenant is active unless the CMS explicitly set isActive to false. */
export function isTenantActive(tenant: Pick<Tenant, "isActive"> | null | undefined): boolean {
  return tenant?.isActive !== false;
}