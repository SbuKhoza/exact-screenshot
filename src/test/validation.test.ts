import { describe, expect, it } from "vitest";
import { childSchema, isPastDate, isSaCell, parentAccountSchema } from "@/lib/validation";

const child = { firstName: "Ayanda", surname: "Khoza", dateOfBirth: "2014-03-02", cellphone: "", subjects: ["Mathematics"], otherSubject: "", grade: "Grade 6", schoolName: "Sunrise Primary" };

describe("validation rules", () => {
  it("accepts SA local and international cellphone formats", () => {
    expect(isSaCell("078 176 3322")).toBe(true);
    expect(isSaCell("+27 78 176 3322")).toBe(true);
    expect(isSaCell("12345")).toBe(false);
  });
  it("rejects future dates of birth", () => {
    expect(isPastDate("2999-01-01")).toBe(false);
    expect(isPastDate("2012-05-05")).toBe(true);
  });
  it("child phone number is optional", () => {
    expect(childSchema.safeParse(child).success).toBe(true);
  });
  it("requires 'Other' subject to be specified", () => {
    expect(childSchema.safeParse({ ...child, subjects: ["Other"] }).success).toBe(false);
  });
  it("passwords must match", () => {
    const r = parentAccountSchema.safeParse({ email: "a@b.co", cellphone: "0781763322", password: "abc12345", confirm: "abc12346", consent: true });
    expect(r.success).toBe(false);
  });
});
