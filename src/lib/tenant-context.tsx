import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectTenantId, validateTenant, type Tenant } from "./tenant";
import { initFirebase } from "./firebase";

type TenantState = {
  loading: boolean;
  tenantId: string | null;
  tenant: Tenant | null;
  error: string | null;
};

const Ctx = createContext<TenantState>({ loading: true, tenantId: null, tenant: null, error: null });

export function TenantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TenantState>({ loading: true, tenantId: null, tenant: null, error: null });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ready = await initFirebase();
        if (!ready) throw new Error("Firebase is not configured");
        const tenantId = await detectTenantId();
        const tenant = await validateTenant(tenantId);
        if (!cancelled) setState({ loading: false, tenantId, tenant, error: null });
      } catch (e) {
        if (!cancelled)
          setState({ loading: false, tenantId: null, tenant: null, error: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useTenant = () => useContext(Ctx);
