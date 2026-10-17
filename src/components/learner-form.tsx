import type { Errors } from "@/lib/validation";
import { useState } from "react";
import { Field, GradeSelect, SubjectPicker, SubmitButton, TextInput } from "@/components/forms";
import { childSchema, studentDetailsSchema, issues } from "@/lib/validation";

export type LearnerValues = {
  firstName: string;
  surname: string;
  dateOfBirth: string;
  cellphone: string;
  subjects: string[];
  otherSubject: string;
  grade: string;
  schoolName: string;
};

export const emptyLearner: LearnerValues = { firstName: "", surname: "", dateOfBirth: "", cellphone: "", subjects: [], otherSubject: "", grade: "", schoolName: "" };

const todayIso = () => new Date().toISOString().slice(0, 10);

export function LearnerForm({
  mode,
  initial = emptyLearner,
  submitLabel,
  extra,
  extraValid,
  onSubmit,
}: {
  mode: "child" | "student";
  initial?: LearnerValues;
  submitLabel: string;
  extra?: React.ReactNode;
  extraValid?: () => string | null;
  onSubmit: (v: LearnerValues) => Promise<void>;
}) {
  const [v, setV] = useState<LearnerValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof LearnerValues) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const r = (mode === "child" ? childSchema : studentDetailsSchema).safeParse(v);
    const errs: Errors = r.success ? {} : issues(r.error);
    const extraErr = extraValid?.();
    if (extraErr) errs.consent = extraErr;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await onSubmit(v);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={mode === "child" ? "Child's first name" : "First name"} error={errors.firstName}><TextInput value={v.firstName} onChange={set("firstName")} /></Field>
        <Field label={mode === "child" ? "Child's surname" : "Surname"} error={errors.surname}><TextInput value={v.surname} onChange={set("surname")} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth" error={errors.dateOfBirth}><TextInput type="date" max={todayIso()} value={v.dateOfBirth} onChange={set("dateOfBirth")} /></Field>
        <Field label={mode === "child" ? "Phone number" : "Cellphone number"} optional={mode === "child"} error={errors.cellphone}>
          <TextInput type="tel" inputMode="tel" placeholder="078 123 4567" value={v.cellphone} onChange={set("cellphone")} />
        </Field>
      </div>
      <SubjectPicker value={v.subjects} onChange={(s) => setV({ ...v, subjects: s })} error={errors.subjects} />
      {v.subjects.includes("Other") && (
        <Field label="Other subject" error={errors.otherSubject}><TextInput value={v.otherSubject} onChange={set("otherSubject")} placeholder="e.g. Physical Sciences" /></Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Grade" error={errors.grade}><GradeSelect value={v.grade} onChange={(g) => setV({ ...v, grade: g })} /></Field>
        <Field label="School name" error={errors.schoolName}><TextInput value={v.schoolName} onChange={set("schoolName")} /></Field>
      </div>
      {extra}
      {errors.consent && <p className="-mt-3 text-sm font-medium text-destructive">{errors.consent}</p>}
      <SubmitButton busy={busy} label="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
