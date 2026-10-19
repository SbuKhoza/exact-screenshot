/**
 * A tenant administrator is the Firebase account the superadmin created for the tenant in the CMS.
 * The CMS uses that account's uid as the tenant id, so the signed-in uid must equal the tenant id.
 * No email verification or second factor is required.
 */
export function canAdminTenant(
  user: { uid: string } | null,
  tenantId: string | null,
  tenant: { isActive?: boolean } | null,
): boolean {
  return !!user && !!tenantId && !!tenant && tenant.isActive !== false && user.uid === tenantId;
}

export const registrationStatuses = ["pending_review", "contacted", "enrolled", "declined"] as const;
export const enquiryStatuses = ["new", "read", "resolved"] as const;