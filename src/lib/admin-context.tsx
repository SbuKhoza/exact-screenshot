import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import { useTenant } from "./tenant-context";
import { canAdminTenant } from "./admin-access";
import { getAdminProfile } from "./admin";

const Ctx = createContext({ loading: true, allowed: false });
export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { tenantId, tenant } = useTenant();
  const eligible = canAdminTenant(user, tenantId, tenant);
  const access = useQuery({
    queryKey: ["admin-access", tenantId, user?.uid, tenant?.isActive],
    enabled: !loading && !!tenantId && eligible,
    retry: false,
    queryFn: async () => {
      if (!user || !tenantId) return false;
      if (!canAdminTenant(user, tenantId, tenant)) return false;
      // A server-enforced read confirms access even before the first profile is saved.
      await getAdminProfile(tenantId, user.uid);
      return true;
    },
  });
  return <Ctx.Provider value={{ loading: loading || (eligible && access.isPending), allowed: eligible && access.data === true }}>{children}</Ctx.Provider>;
}
export const useAdmin = () => useContext(Ctx);