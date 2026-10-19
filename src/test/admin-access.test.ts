import { describe, expect, it } from "vitest";
import { canAdminTenant } from "@/lib/admin-access";

describe("Tenant admin access", () => {
  const tenantId = "tenant-uid-1";
  const tenant = { isActive: true };
  it("allows the account the superadmin created for this tenant, without email verification", () => {
    expect(canAdminTenant({ uid: tenantId }, tenantId, tenant)).toBe(true);
  });
  it("allows tenants that have no isActive flag", () => {
    expect(canAdminTenant({ uid: tenantId }, tenantId, {})).toBe(true);
  });
  it("denies any other account, such as a parent or student", () => {
    expect(canAdminTenant({ uid: "someone-else" }, tenantId, tenant)).toBe(false);
  });
  it("denies a different tenant's administrator", () => {
    expect(canAdminTenant({ uid: "tenant-uid-2" }, tenantId, tenant)).toBe(false);
  });
  it("denies suspended tenants", () => {
    expect(canAdminTenant({ uid: tenantId }, tenantId, { isActive: false })).toBe(false);
  });
  it("denies signed-out visitors and unresolved tenants", () => {
    expect(canAdminTenant(null, tenantId, tenant)).toBe(false);
    expect(canAdminTenant({ uid: tenantId }, null, tenant)).toBe(false);
    expect(canAdminTenant({ uid: tenantId }, tenantId, null)).toBe(false);
  });
});