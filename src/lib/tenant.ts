import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { fb } from "./firebase";

/**
 * Multi-tenant detection.
 *
 * Priority:
 * 1. localhost / 127.0.0.1 → localStorage "dev_tenant_id" (set it once in devtools
 *    or via setDevTenantId()).
 * 2. Firestore `domains` collection: { domain: <hostname>, tenantId: <id> }.
 * 3. Firestore `subdomains` collection: doc id = first hostname label.
 *
 * The resolved tenant ID is cached in memory and sessionStorage so we only
 * hit Firestore once per tab.
 */

const CACHE_KEY = "tenant_id";
const DEV_KEY = "dev_tenant_id";

let cached: string | null = null;

export function setDevTenantId(tenantId: string) {
  localStorage.setItem(DEV_KEY, tenantId);
  sessionStorage.removeItem(CACHE_KEY);
  cached = null;
}

export function getCachedTenantId(): string | null {
  return cached ?? sessionStorage.getItem(CACHE_KEY);
}

export async function detectTenantId(): Promise<string> {
  if (cached) return cached;
  const fromSession = sessionStorage.getItem(CACHE_KEY);
  if (fromSession) return (cached = fromSession);

  const hostname = window.location.hostname;

  // Development fallback
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const devTenantId = localStorage.getItem(DEV_KEY);
    if (devTenantId) return remember(devTenantId);
    throw new Error(
      "No tenant ID for local development. Run setDevTenantId('<tenantId>') in the console once.",
    );
  }

  const { db } = fb();

  // Custom domain mapping: domains collection, field `domain` == hostname
  try {
    const snap = await getDocs(query(collection(db, "domains"), where("domain", "==", hostname)));
    if (!snap.empty) {
      const tenantId = snap.docs[0].data().tenantId as string;
      if (tenantId) return remember(tenantId);
    }
  } catch (e) {
    console.error("Error checking domain mapping:", e);
  }

  // Subdomain mapping: subdomains collection, doc id = first label
  const subdomain = hostname.split(".")[0];
  if (subdomain && subdomain !== hostname) {
    try {
      const subDoc = await getDoc(doc(db, "subdomains", subdomain));
      if (subDoc.exists()) {
        const tenantId = subDoc.data().tenantId as string;
        if (tenantId) return remember(tenantId);
      }
    } catch (e) {
      console.error("Error checking subdomain mapping:", e);
    }
  }

  throw new Error(`Unable to detect tenant from domain: ${hostname}`);
}

function remember(tenantId: string): string {
  cached = tenantId;
  sessionStorage.setItem(CACHE_KEY, tenantId);
  return tenantId;
}

export type Tenant = { id: string; businessName?: string; isActive?: boolean; [k: string]: unknown };

/** Validates that a tenant exists and is active. Returns its data. */
export async function validateTenant(tenantId: string): Promise<Tenant> {
  const snap = await getDoc(doc(fb().db, "tenants", tenantId));
  if (!snap.exists()) throw new Error(`Tenant ${tenantId} does not exist`);
  const data = snap.data();
  if (data.isActive === false) throw new Error(`Tenant ${tenantId} is inactive`);
  return { id: snap.id, ...data };
}
