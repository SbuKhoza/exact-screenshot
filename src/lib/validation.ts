import { z } from "zod";

export const normalizeCell = (v: string) => v.replace(/[\s()-]/g, "");
// SA mobile: 0XX XXX XXXX or +27 XX XXX XXXX (mobile prefixes 6, 7, 8)
export const isSaCell = (v: string) => /^(\+27|0027|0)[6-8]\d{8}$/.test(normalizeCell(v));

export const cell = z.string().trim().min(1, "Cellphone number is required").refine(isSaCell, "Enter a valid South African cellphone number, e.g. 078 123 4567");
export const optionalCell = z.string().trim().refine((v) => v === "" || isSaCell(v), "Enter a valid South African number or leave it blank");

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/\d/, "Password must include a number");

export const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255);

const consent = z.literal(true, { errorMap: () => ({ message: "Please accept the privacy policy to continue" }) });

export const studentAccountSchema = z
  .object({ email, password, confirm: z.string(), consent })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export const parentAccountSchema = z
  .object({ email, cellphone: cell, password, confirm: z.string(), consent })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(60);

export const parentProfileSchema = z.object({ firstName: name("First name"), surname: name("Surname"), cellphone: cell });

export const isPastDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d <= today && d.getFullYear() > 1900;
};

const learnerBase = {
  firstName: name("First name"),
  surname: name("Surname"),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine(isPastDate, "Enter a valid date that is not in the future"),
  subjects: z.array(z.string()).min(1, "Choose at least one subject"),
  otherSubject: z.string().trim().max(80),
  grade: z.string().min(1, "Grade is required"),
  schoolName: z.string().trim().min(1, "School name is required").max(120),
};

const otherRule = (d: { subjects: string[]; otherSubject: string }) => !d.subjects.includes("Other") || d.otherSubject.length > 0;
const otherMsg = { path: ["otherSubject"], message: "Please specify the other subject" };

export const childSchema = z.object({ ...learnerBase, cellphone: optionalCell }).refine(otherRule, otherMsg);
export const studentDetailsSchema = z.object({ ...learnerBase, cellphone: cell }).refine(otherRule, otherMsg);

export const contactSchema = z.object({
  name: name("Name"),
  email,
  subject: z.string().trim().min(1, "Subject is required").max(120),
  message: z.string().trim().min(1, "Message is required").max(1000),
});

export function issues(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
