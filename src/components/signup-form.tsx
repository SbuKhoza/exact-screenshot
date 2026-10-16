import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, Consent, Field, NotConfigured, PasswordInput, SubmitButton, TextInput } from "@/components/forms";
import { useRedirectIfSignedIn } from "@/components/guard";
import { firebaseConfigured, friendlyError } from "@/lib/firebase";
import { createAccount, type Role } from "@/lib/services";
import { useAuth } from "@/lib/auth";
import { issues, parentAccountSchema, studentAccountSchema } from "@/lib/validation";

export function SignupForm({ role }: { role: Role }) {
  const [busy, setBusy] = useState(false);
  useRedirectIfSignedIn(busy);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState({ email: "", cellphone: "", password: "", confirm: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: "email" | "cellphone" | "password" | "confirm") => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const r = (role === "parent" ? parentAccountSchema : studentAccountSchema).safeParse(v);
    if (!r.success) return setErrors(issues(r.error));
    setErrors({});
    setBusy(true);
    try {
      await createAccount(role, v.email, v.password, role === "parent" ? v.cellphone : undefined);
      await refresh();
      navigate({ to: role === "parent" ? "/parent/profile" : "/student/details", replace: true });
    } catch (err) {
      setErrors({ form: friendlyError(err) });
      setBusy(false);
    }
  }

  return (
    <AuthCard
      step="Step 1 of 2"
      title={role === "parent" ? "Parent / Guardian account" : "Student account"}
      subtitle={role === "parent" ? "You'll use this email and password to log in and manage your children." : "You'll log in with this email and password."}
      footer={<>Already registered? <Link to="/login" className="font-semibold text-primary underline">Log in</Link></>}
    >
      {!firebaseConfigured && <div className="mb-5"><NotConfigured /></div>}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Email address" error={errors.email}><TextInput type="email" autoComplete="email" value={v.email} onChange={set("email")} /></Field>
        {role === "parent" && (
          <Field label="Cellphone number" error={errors.cellphone}><TextInput type="tel" inputMode="tel" placeholder="078 123 4567" value={v.cellphone} onChange={set("cellphone")} /></Field>
        )}
        <Field label="Password" hint="At least 8 characters, with a letter and a number." error={errors.password}><PasswordInput autoComplete="new-password" value={v.password} onChange={set("password")} /></Field>
        <Field label="Confirm password" error={errors.confirm}><PasswordInput autoComplete="new-password" value={v.confirm} onChange={set("confirm")} /></Field>
        <Consent checked={v.consent} onChange={(c) => setV({ ...v, consent: c })} error={errors.consent} />
        {errors.form && <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{errors.form}</p>}
        <SubmitButton busy={busy} label="Creating account…">Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
