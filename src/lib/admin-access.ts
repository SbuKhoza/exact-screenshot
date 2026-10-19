export function canAdminTenant(user: { email: string | null; emailVerified: boolean } | null, tenant: { email?: string; isActive?: boolean } | null): boolean {
  return !!user?.email && user.emailVerified && !!tenant?.email && tenant.isActive !== false
    && user.email.toLowerCase() === tenant.email.toLowerCase();
}

export const registrationStatuses = ["pending_review", "contacted", "enrolled", "declined"] as const;
export const enquiryStatuses = ["new", "read", "resolved"] as const;