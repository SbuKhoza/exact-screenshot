import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "./auth";
import { useTenant } from "./tenant-context";
import { canAdminTenant } from "./admin-access";

const Ctx = createContext({ loading: true, allowed: false });

/**
 * Decides whether the signed-in user may open the admin area.
 * The administrator is the Firebase account the superadmin created for this tenant (uid === tenantId),
 * so no extra lookup is needed. Real protection is enforced by Firestore rules on every read and write.
 */
export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { tenantId, tenant } = useTenant();
  const allowed = !loading && canAdminTenant(user, tenantId, tenant);
  return <Ctx.Provider value={{ loading, allowed }}>{children}</Ctx.Provider>;
}
export const useAdmin = () => useContext(Ctx);