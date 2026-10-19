import { describe, expect, it } from "vitest";
import { canAdminTenant } from "@/lib/admin-access";

describe("Tenant admin access", () => {
  const tenant = { email: "assigned@example.com", isActive: true };
  it("allows the verified email assigned by the superadmin", () => {
    expect(canAdminTenant({ email: "ASSIGNED@example.com", emailVerified: true }, tenant)).toBe(true);
  });
  it("denies an email not linked to this tenant", () => {
    expect(canAdminTenant({ email: "other@example.com", emailVerified: true }, tenant)).toBe(false);
  });
  it("denies unverified email ownership", () => {
    expect(canAdminTenant({ email: tenant.email, emailVerified: false }, tenant)).toBe(false);
  });
  it("denies suspended tenants", () => {
    expect(canAdminTenant({ email: tenant.email, emailVerified: true }, { ...tenant, isActive: false })).toBe(false);
  });
  it("denies missing assignments", () => {
    expect(canAdminTenant({ email: tenant.email, emailVerified: true }, {})).toBe(false);
  });
});