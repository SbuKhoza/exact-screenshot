import { z } from "zod";

export type PlannedLesson = { id: string; title: string; plan: string };
export type LessonRegister = {
  id: string;
  groupId: string;
  tenantId: string;
  learnerId: string;
  learnerUid: string;
  learnerName: string;
  startDate: string;
  meetingUrl: string;
  lessons: PlannedLesson[];
  marks: Record<string, number>;
};

const dateIsValid = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === (month ?? 1) - 1 && parsed.getUTCDate() === day;
};

const secureUrl = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "Enter a valid meeting link beginning with https://");

export const lessonRegisterSchema = z.object({
  startDate: z.string().refine(dateIsValid, "Choose a valid start date"),
  meetingUrl: secureUrl,
  learnerIds: z.array(z.string().min(1)).min(1, "Select at least one learner").max(450).refine((ids) => new Set(ids).size === ids.length, "A learner can only be selected once"),
  lessons: z.array(z.object({
    id: z.string().regex(/^lesson-[1-9]\d*$/),
    title: z.string().trim().min(1, "Add a title for every lesson").max(100),
    plan: z.string().trim().min(1, "Add a plan for every lesson").max(1000),
  })).min(1, "Add at least one lesson").max(12, "A register can have up to 12 lessons"),
});

export type LessonRegisterInput = z.infer<typeof lessonRegisterSchema>;

export function validateLessonMark(lessons: PlannedLesson[], lessonId: string, score: number): number {
  if (!lessons.some((lesson) => lesson.id === lessonId)) throw new Error("This lesson is not in the register.");
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error("Enter a mark from 0 to 100.");
  return score;
}