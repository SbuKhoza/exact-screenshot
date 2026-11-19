import { describe, expect, it } from "vitest";
import { lessonRegisterSchema, validateLessonMark, type PlannedLesson } from "@/lib/lesson-register";

const lessons: PlannedLesson[] = [{ id: "lesson-1", title: "Algebra", plan: "Linear equations" }];
const validInput = { startDate: "2026-11-20", meetingUrl: "https://meet.example.com/class", learnerIds: ["student-1"], lessons };

describe("lesson registers", () => {
  it("accepts a valid start date and one or more selected learners", () => {
    expect(lessonRegisterSchema.safeParse(validInput).success).toBe(true);
  });
  it("requires a selected learner", () => {
    expect(lessonRegisterSchema.safeParse({ ...validInput, learnerIds: [] }).success).toBe(false);
  });
  it("rejects invalid calendar dates and non-secure meeting links", () => {
    expect(lessonRegisterSchema.safeParse({ ...validInput, startDate: "2026-02-30" }).success).toBe(false);
    expect(lessonRegisterSchema.safeParse({ ...validInput, meetingUrl: "http://meet.example.com" }).success).toBe(false);
  });
  it("records marks only for planned lessons and within the 0–100 range", () => {
    expect(validateLessonMark(lessons, "lesson-1", 0)).toBe(0);
    expect(validateLessonMark(lessons, "lesson-1", 100)).toBe(100);
    expect(() => validateLessonMark(lessons, "lesson-1", 101)).toThrow("Enter a mark from 0 to 100.");
    expect(() => validateLessonMark(lessons, "lesson-2", 50)).toThrow("This lesson is not in the register.");
  });
});