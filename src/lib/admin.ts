import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { fb } from "./firebase";
import type { Learner } from "./services";
import { registrationStatuses, enquiryStatuses } from "./admin-access";

export type AdminProfile = { displayName: string; cellphoneNumber: string };
export type Enquiry = { id: string; name: string; email: string; subject: string; message: string; status: string };

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
export async function listAdminEnquiries(tenantId: string): Promise<Enquiry[]> {
  const snap = await getDocs(query(collection(fb().db, "contactMessages"), where("tenantId", "==", tenantId)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Enquiry);
}
export async function setRegistrationStatus(id: string, status: string) {
  if (!registrationStatuses.some(s => s === status)) throw new Error("Invalid status");
  await updateDoc(doc(fb().db, "students", id), { registrationStatus: status, updatedAt: serverTimestamp() });
}
export async function setEnquiryStatus(id: string, status: string) {
  if (!enquiryStatuses.some(s => s === status)) throw new Error("Invalid status");
  await updateDoc(doc(fb().db, "contactMessages", id), { status });
}