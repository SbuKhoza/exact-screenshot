import { describe, expect, it } from "vitest";
import { canAdminTenant } from "@/lib/admin-access";

describe("Tenant admin access", () => {
  const tenantId = "tenant-uid-1";
  const tenant = { email: "admin@example.com", isActive: true };
  it("allows the verified admin email assigned to this active tenant", () => {
    expect(canAdminTenant({ email: "admin@example.com", emailVerified: true }, tenantId, tenant)).toBe(true);
  });
  it("matches assigned admin email without regard to case", () => {
    expect(canAdminTenant({ email: "ADMIN@example.com", emailVerified: true }, tenantId, tenant)).toBe(true);
  });
  it("denies any other account, such as a parent or student", () => {
    expect(canAdminTenant({ email: "parent@example.com", emailVerified: true }, tenantId, tenant)).toBe(false);
  });
  it("denies an unverified account even when the email matches", () => {
    expect(canAdminTenant({ email: "admin@example.com", emailVerified: false }, tenantId, tenant)).toBe(false);
  });
  it("denies suspended tenants", () => {
    expect(canAdminTenant({ email: "admin@example.com", emailVerified: true }, tenantId, { ...tenant, isActive: false })).toBe(false);
  });
  it("denies signed-out visitors and unresolved tenants", () => {
    expect(canAdminTenant(null, tenantId, tenant)).toBe(false);
    expect(canAdminTenant({ email: "admin@example.com", emailVerified: true }, null, tenant)).toBe(false);
    expect(canAdminTenant({ email: "admin@example.com", emailVerified: true }, tenantId, null)).toBe(false);
  });
});