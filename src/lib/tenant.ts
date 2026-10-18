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
 * 1. localhost only: localStorage "dev_tenant_id" / VITE_FALLBACK_TENANT_ID, if set (optional override).
 * 2. domains/{host}         (host includes the port, e.g. "localhost:8080"; also tries www / non-www).
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

function hostnameVariants(hostname: string, host: string): string[] {
  const out: string[] = [];
  for (const h of [host, hostname]) {
    const lower = h.trim().toLowerCase();
    const bare = lower.startsWith("www.") ? lower.slice(4) : lower;
    out.push(lower, bare, `www.${bare}`);
  }
  return Array.from(new Set(out));
}

export async function detectTenantId(): Promise<string> {
  const fromCache = getCachedTenantId();
  if (fromCache) return (cached = fromCache);

  const hostname = window.location.hostname.toLowerCase();
  // host includes the port, e.g. "localhost:8080" (the CMS stores it that way).
  const host = window.location.host.toLowerCase();
  const port = window.location.port;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  // 1. Explicit overrides for local development (optional)
  if (isLocal) {
    const devTenantId = localStorage.getItem(DEV_KEY);
    if (devTenantId) return remember(devTenantId);
    const envTenant = import.meta.env["VITE_FALLBACK_TENANT_ID"] as string | undefined;
    if (envTenant) return remember(envTenant);
  }

  const { db } = fb();
  const variants = hostnameVariants(hostname, host);

  // 2. Custom domain: domains/{host} (host may include the port)
  for (const candidate of variants) {
    try {
      const snap = await getDoc(doc(db, "domains", candidate));
      if (snap.exists()) {
        const tenantId = snap.data()["tenantId"] as string | undefined;
        if (tenantId) return remember(tenantId);
      }
    } catch (e) {
      console.error("Error checking domain mapping:", e);
    }
  }

  // 3. Custom domain: query by field (in case the doc id differs from the domain)
  for (const candidate of variants) {
    try {
      const snap = await getDocs(
        query(collection(db, "domains"), where("domain", "==", candidate), limit(1)),
      );
      const tenantId = snap.docs[0]?.data()["tenantId"] as string | undefined;
      if (tenantId) return remember(tenantId);
    } catch (e) {
      console.error("Error querying domain mapping:", e);
    }
  }

  // 4. Subdomain: subdomains/{first label}. On localhost the CMS saves "localhost-8080".
  const subdomainCandidates = isLocal
    ? [port ? `${hostname}-${port}` : hostname]
    : hostname.split(".").length > 1
      ? [hostname.split(".")[0] as string]
      : [];
  for (const sub of subdomainCandidates) {
    try {
      const subDoc = await getDoc(doc(db, "subdomains", sub));
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

  throw new TenantNotFoundError(host);
}

export class TenantNotFoundError extends Error {
  constructor(public readonly hostname: string) {
    super(
      `No tenant is mapped to "${hostname}". In the CMS, set this tenant's Custom Domain to exactly "${hostname}"` +
        ` (or run setDevTenantId('<tenantId>') on localhost).`,
    );
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