import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { fb } from "./firebase";
import type { Learner } from "./services";
import { registrationStatuses, enquiryStatuses } from "./admin-access";

export type AdminProfile = { displayName: string; cellphoneNumber: string };
export type AdminBrand = { logoText: string; socialLinks: Record<"facebook" | "instagram" | "youtube" | "linkedin" | "tiktok", string> };
export type AdminAccount = { uid: string; email: string; role: string; profileCompleted: boolean };
export type Enquiry = { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt?: { toMillis?: () => number } };

const emptyBrand: AdminBrand = {
  logoText: "",
  socialLinks: { facebook: "", instagram: "", youtube: "", linkedin: "", tiktok: "" },
};

export async function getAdminBrand(tenantId: string): Promise<AdminBrand> {
  const snap = await getDoc(doc(fb().db, "tenants", tenantId, "data", "brand"));
  if (!snap.exists()) return emptyBrand;
  const data = snap.data();
  const rawLinks = data["socialLinks"];
  const socialLinks = rawLinks && typeof rawLinks === "object" ? rawLinks as AdminBrand["socialLinks"] : emptyBrand.socialLinks;
  return { logoText: typeof data["logoText"] === "string" ? data["logoText"] : "", socialLinks: { ...emptyBrand.socialLinks, ...socialLinks } };
}

export async function saveAdminBrand(tenantId: string, brand: AdminBrand) {
  await setDoc(doc(fb().db, "tenants", tenantId, "data", "brand"), {
    logoText: brand.logoText.trim(),
    socialLinks: Object.fromEntries(Object.entries(brand.socialLinks).map(([key, value]) => [key, value.trim()])),
    updatedAt: serverTimestamp(),
  });
}

export async function getAdminProfile(tenantId: string, uid: string): Promise<AdminProfile | null> {
  const snap = await getDoc(doc(fb().db, "tenants", tenantId, "adminProfiles", uid));
  return snap.exists() ? snap.data() as AdminProfile : null;
}
export async function saveAdminProfile(tenantId: string, uid: string, profile: AdminProfile) {
  await setDoc(doc(fb().db, "tenants", tenantId, "adminProfiles", uid), {
    displayName: profile.displayName.trim(), cellphoneNumber: profile.cellphoneNumber.trim(), updatedAt: serverTimestamp(),
  });
}
export async function listAdminLearners(tenantId: string): Promise<Learner[]> {
  const snap = await getDocs(query(collection(fb().db, "students"), where("tenantId", "==", tenantId)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Learner);
}
export async function listAdminAccounts(tenantId: string): Promise<AdminAccount[]> {
  const snap = await getDocs(query(collection(fb().db, "users"), where("tenantId", "==", tenantId)));
  return snap.docs.flatMap(d => {
    const data = d.data();
    return typeof data["email"] === "string" && data["email"].trim()
      ? [{ uid: d.id, email: data["email"], role: typeof data["role"] === "string" ? data["role"] : "account", profileCompleted: data["profileCompleted"] === true }]
      : [];
  }).sort((a, b) => a.email.localeCompare(b.email));
}
export async function listAdminEnquiries(tenantId: string): Promise<Enquiry[]> {
  const snap = await getDocs(query(collection(fb().db, "contactMessages"), where("tenantId", "==", tenantId)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Enquiry)
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}
export async function setRegistrationStatus(id: string, status: string) {
  if (!registrationStatuses.some(s => s === status)) throw new Error("Invalid status");
  await updateDoc(doc(fb().db, "students", id), { registrationStatus: status, updatedAt: serverTimestamp() });
}
export async function setEnquiryStatus(id: string, status: string) {
  if (!enquiryStatuses.some(s => s === status)) throw new Error("Invalid status");
  await updateDoc(doc(fb().db, "contactMessages", id), { status });
}