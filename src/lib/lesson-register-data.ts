import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { fb } from "./firebase";
import { lessonEntryBelongsTo, lessonRegisterSchema, validateLessonMark, type LessonRegister, type LessonRegisterInput } from "./lesson-register";
import type { Learner } from "./services";

export type AdminLessonRegister = {
  id: string;
  tenantId: string;
  createdBy: string;
  startDate: string;
  meetingUrl: string;
  lessons: LessonRegister["lessons"];
  learnerIds: string[];
};

function buildLessonEntry(data: Record<string, unknown>, id: string): LessonRegister {
  const lessons = Array.isArray(data["lessons"]) ? data["lessons"] as LessonRegister["lessons"] : [];
  return {
    id,
    groupId: String(data["groupId"] ?? ""),
    tenantId: String(data["tenantId"] ?? ""),
    learnerId: String(data["learnerId"] ?? ""),
    learnerUid: String(data["learnerUid"] ?? ""),
    parentUid: typeof data["parentUid"] === "string" ? data["parentUid"] : null,
    learnerName: String(data["learnerName"] ?? "Learner"),
    startDate: String(data["startDate"] ?? ""),
    meetingUrl: String(data["meetingUrl"] ?? ""),
    lessons,
    marks: {},
  };
}

export async function listAdminLessonRegisters(tenantId: string): Promise<AdminLessonRegister[]> {
  const snap = await getDocs(query(collection(fb().db, "lessonRegisters"), where("tenantId", "==", tenantId)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as AdminLessonRegister)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

async function addMarks(entries: LessonRegister[]): Promise<LessonRegister[]> {
  return Promise.all(entries.map(async (entry) => {
    const snap = await getDocs(collection(fb().db, "lessonRegisterEntries", entry.id, "marks"));
    const marks: Record<string, number> = {};
    for (const mark of snap.docs) {
      const score = mark.data()["mark"];
      if (typeof score === "number") marks[mark.id] = score;
    }
    return { ...entry, marks };
  }));
}

export async function listAdminRegisterEntries(tenantId: string, groupId: string): Promise<LessonRegister[]> {
  const snap = await getDocs(query(
    collection(fb().db, "lessonRegisterEntries"),
    where("tenantId", "==", tenantId),
    where("groupId", "==", groupId),
  ));
  const entries = snap.docs.map((item) => buildLessonEntry(item.data(), item.id));
  return addMarks(entries.sort((a, b) => a.learnerName.localeCompare(b.learnerName)));
}

export async function listLearnerLessonEntries(userId: string, parent = false): Promise<LessonRegister[]> {
  const ownerField = parent ? "parentUid" : "learnerUid";
  const snap = await getDocs(query(collection(fb().db, "lessonRegisterEntries"), where(ownerField, "==", userId)));
  const entries = snap.docs.map((item) => buildLessonEntry(item.data(), item.id))
    .filter((entry) => lessonEntryBelongsTo(entry, userId))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  return addMarks(entries);
}

export async function createAdminLessonRegister(
  tenantId: string,
  createdBy: string,
  learners: Learner[],
  untrustedInput: LessonRegisterInput,
): Promise<string> {
  const parsed = lessonRegisterSchema.safeParse(untrustedInput);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check the register details.");
  const input = parsed.data;
  const eligible = new Map(learners
    .filter((learner) => learner.tenantId === tenantId
      && learner.registrationStatus === "enrolled"
      && (typeof learner.uid === "string" || typeof learner.parentUid === "string"))
    .map((learner) => [learner.id, learner]));
  const selected = input.learnerIds.map((id) => eligible.get(id));
  if (selected.some((learner) => !learner)) throw new Error("Only enrolled learners with a linked account can be added.");

  const db = fb().db;
  const group = doc(collection(db, "lessonRegisters"));
  await setDoc(group, {
    tenantId,
    createdBy,
    startDate: input.startDate,
    meetingUrl: input.meetingUrl,
    lessons: input.lessons,
    learnerIds: input.learnerIds,
    createdAt: serverTimestamp(),
  });
  // Rules evaluate each write independently; small batches stay within Firestore's
  // document-access-call budget while still handling a full selected class.
  for (let offset = 0; offset < selected.length; offset += 4) {
    const batch = writeBatch(db);
    for (const learner of selected.slice(offset, offset + 4)) {
      if (!learner) continue;
      const entry = doc(collection(db, "lessonRegisterEntries"));
      batch.set(entry, {
        tenantId,
        groupId: group.id,
        learnerId: learner.id,
        learnerUid: learner.uid ?? null,
        parentUid: learner.parentUid,
        learnerName: `${learner.firstName} ${learner.surname}`.trim(),
        startDate: input.startDate,
        meetingUrl: input.meetingUrl,
        lessons: input.lessons,
        lessonIds: input.lessons.map((lesson) => lesson.id),
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
  return group.id;
}

export async function setLessonCompletionMark(entry: LessonRegister, lessonId: string, score: number): Promise<void> {
  const mark = validateLessonMark(entry.lessons, lessonId, score);
  await setDoc(doc(fb().db, "lessonRegisterEntries", entry.id, "marks", lessonId), {
    mark,
    updatedAt: serverTimestamp(),
  });
}