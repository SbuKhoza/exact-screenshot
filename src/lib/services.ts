import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { fb } from "./firebase";
import { normalizeCell } from "./validation";
import { detectTenantId } from "./tenant";

export type Role = "parent" | "student";
export type Account = { uid: string; email: string; role: Role; profileCompleted: boolean };
export type Learner = {
  id: string;
  accountType: "parent_registered" | "independent";
  parentUid: string | null;
  uid: string | null;
  firstName: string;
  surname: string;
  dateOfBirth: string;
  cellphoneNumber: string;
  email?: string;
  subjects: string[];
  otherSubject: string;
  grade: string;
  schoolName: string;
  registrationStatus: string;
  changeRequest?: string;
};
export type ParentProfile = { firstName: string; surname: string; cellphoneNumber: string; email: string };

export async function createAccount(role: Role, email: string, password: string, cellphone?: string) {
  const tenantId = await detectTenantId();
  const { auth, db } = fb();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const batch = writeBatch(db);
  batch.set(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    tenantId,
    email: cred.user.email,
    role,
    profileCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (role === "parent" && cellphone) {
    batch.set(doc(db, "parents", cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      firstName: "",
      surname: "",
      cellphoneNumber: normalizeCell(cellphone),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return cred.user;
}

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(fb().auth, email.trim(), password);
}
export const logout = () => signOut(fb().auth);
export const resetPassword = (email: string) =>
  sendPasswordResetEmail(fb().auth, email.trim(), { url: window.location.origin + "/login" });

export async function changePassword(current: string, next: string) {
  const user = fb().auth.currentUser;
  if (!user?.email) throw new Error("auth/requires-recent-login");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
  await updatePassword(user, next);
}

export async function getAccount(uid: string): Promise<Account | null> {
  const snap = await getDoc(doc(fb().db, "users", uid));
  return snap.exists() ? (snap.data() as Account) : null;
}

export async function getParentProfile(uid: string): Promise<ParentProfile | null> {
  const snap = await getDoc(doc(fb().db, "parents", uid));
  return snap.exists() ? (snap.data() as ParentProfile) : null;
}

export async function saveParentProfile(uid: string, email: string, p: { firstName: string; surname: string; cellphone: string }) {
  const { db } = fb();
  const existing = await getDoc(doc(db, "parents", uid));
  const batch = writeBatch(db);
  const data = {
    uid,
    email,
    firstName: p.firstName.trim(),
    surname: p.surname.trim(),
    cellphoneNumber: normalizeCell(p.cellphone),
    updatedAt: serverTimestamp(),
  };
  batch.set(doc(db, "parents", uid), existing.exists() ? data : { ...data, createdAt: serverTimestamp() }, { merge: true });
  batch.update(doc(db, "users", uid), { profileCompleted: true, updatedAt: serverTimestamp() });
  await batch.commit();
}

type LearnerInput = {
  firstName: string;
  surname: string;
  dateOfBirth: string;
  cellphone: string;
  subjects: string[];
  otherSubject: string;
  grade: string;
  schoolName: string;
};

const learnerFields = (v: LearnerInput) => ({
  firstName: v.firstName.trim(),
  surname: v.surname.trim(),
  dateOfBirth: v.dateOfBirth,
  cellphoneNumber: v.cellphone ? normalizeCell(v.cellphone) : "",
  subjects: v.subjects,
  otherSubject: v.subjects.includes("Other") ? v.otherSubject.trim() : "",
  grade: v.grade,
  schoolName: v.schoolName.trim(),
});

export async function addChild(parentUid: string, v: LearnerInput) {
  const tenantId = await detectTenantId();
  const ref = await addDoc(collection(fb().db, "students"), {
    ...learnerFields(v),
    tenantId,
    accountType: "parent_registered",
    parentUid,
    uid: null,
    registrationStatus: "pending_review",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLearner(id: string, v: LearnerInput) {
  await updateDoc(doc(fb().db, "students", id), { ...learnerFields(v), updatedAt: serverTimestamp() });
}

export async function requestChange(id: string, note: string) {
  await updateDoc(doc(fb().db, "students", id), { changeRequest: note.trim(), updatedAt: serverTimestamp() });
}

export async function listChildren(parentUid: string): Promise<Learner[]> {
  const snap = await getDocs(query(collection(fb().db, "students"), where("parentUid", "==", parentUid)));
  return snap.docs.map((d) => ({ ...(d.data() as Learner), id: d.id }));
}

export async function getLearner(id: string): Promise<Learner | null> {
  const snap = await getDoc(doc(fb().db, "students", id));
  return snap.exists() ? { ...(snap.data() as Learner), id: snap.id } : null;
}

/** Independent student: profile doc id = their auth UID. */
export async function saveStudentDetails(uid: string, email: string, v: LearnerInput) {
  const tenantId = await detectTenantId();
  const { db } = fb();
  const ref = doc(db, "students", uid);
  const existing = await getDoc(ref);
  const batch = writeBatch(db);
  if (existing.exists()) {
    batch.update(ref, { ...learnerFields(v), updatedAt: serverTimestamp() });
  } else {
    batch.set(ref, {
      ...learnerFields(v),
      tenantId,
      accountType: "independent",
      parentUid: null,
      uid,
      email,
      registrationStatus: "pending_review",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  batch.update(doc(db, "users", uid), { profileCompleted: true, updatedAt: serverTimestamp() });
  await batch.commit();
}

export async function sendContactMessage(v: { name: string; email: string; subject: string; message: string }) {
  const tenantId = await detectTenantId();
  await addDoc(collection(fb().db, "contactMessages"), {
    name: v.name.trim(),
    tenantId,
    email: v.email.trim(),
    subject: v.subject.trim(),
    message: v.message.trim(),
    status: "new",
    createdAt: serverTimestamp(),
  });
}

export { setDoc };
