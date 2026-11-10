/** Tenant admin access is tied to the verified email assigned to the active tenant by its superadmin. */
export function canAdminTenant(
  user: { email: string | null; emailVerified: boolean } | null,
  tenantId: string | null,
  tenant: { email?: string; isActive?: boolean } | null,
): boolean {
  return !!user?.email && user.emailVerified && !!tenantId && !!tenant?.email
    && tenant.isActive !== false && user.email.toLowerCase() === tenant.email.toLowerCase();
}

export const registrationStatuses = ["pending_review", "contacted", "enrolled", "declined"] as const;
export const enquiryStatuses = ["new", "read", "resolved"] as const;