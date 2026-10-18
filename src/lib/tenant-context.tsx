import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { clearCachedTenantId, detectTenantId, isTenantActive, TenantNotFoundError, type Tenant } from "./tenant";
import { fb, initFirebase } from "./firebase";

export type TenantStatus = "loading" | "active" | "suspended" | "not_found" | "error";

type TenantState = {
  status: TenantStatus;
  tenantId: string | null;
  tenant: Tenant | null;
  error: string | null;
};

const initial: TenantState = { status: "loading", tenantId: null, tenant: null, error: null };

const Ctx = createContext<TenantState>(initial);

/**
 * Resolves the tenant for the current domain and keeps its document live.
 * If the CMS suspends (or reactivates) the tenant while a visitor is on the site,
 * the status flips immediately without a reload.
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TenantState>(initial);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    void (async () => {
      try {
        const ready = await initFirebase();
        if (!ready) throw new Error("Firebase is not configured");
        const tenantId = await detectTenantId();
        if (cancelled) return;

        unsub = onSnapshot(
          doc(fb().db, "tenants", tenantId),
          (snap) => {
            if (cancelled) return;
            if (!snap.exists()) {
              clearCachedTenantId();
              setState({ status: "not_found", tenantId, tenant: null, error: null });
              return;
            }
            const tenant = { id: snap.id, ...snap.data() } as Tenant;
            setState({
              status: isTenantActive(tenant) ? "active" : "suspended",
              tenantId,
              tenant,
              error: null,
            });
          },
          (err) => {
            if (cancelled) return;
            console.error("[tenant] Could not read tenants/" + tenantId, err);
            setState({ status: "error", tenantId, tenant: null, error: `${err.code}: ${err.message}` });
          },
        );
      } catch (e) {
        if (cancelled) return;
        if (e instanceof TenantNotFoundError) {
          setState({ status: "not_found", tenantId: null, tenant: null, error: e.message });
        } else {
          console.error("[tenant] Tenant lookup failed", e);
          setState({ status: "error", tenantId: null, tenant: null, error: (e as Error).message });
        }
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useTenant = () => useContext(Ctx);