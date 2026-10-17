import type { Errors } from "@/lib/validation";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthCard, Field, NotConfigured, PasswordInput, SubmitButton, TextInput } from "@/components/forms";
import { useRedirectIfSignedIn } from "@/components/guard";
import { firebaseConfigured, friendlyError } from "@/lib/firebase";
import { getAccount, login } from "@/lib/services";
import { homeFor } from "@/lib/auth";
import { email, issues } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — SS Academy" },
      { name: "description", content: "Log in to your parent or student account." },
      { property: "og:title", content: "Login — SS Academy" },
      { property: "og:description", content: "Log in to your account." },
    ],
  }),
  component: Login,
});

const schema = z.object({ email, password: z.string().min(1, "Password is required") });

function Login() {
  const [busy, setBusy] = useState(false);
  useRedirectIfSignedIn(busy);
  const navigate = useNavigate();
  const [v, setV] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const r = schema.safeParse(v);
    if (!r.success) return setErrors(issues(r.error));
    setErrors({});
    setBusy(true);
    try {
      const cred = await login(v.email, v.password);
      const acct = await getAccount(cred.user.uid);
      navigate({ to: homeFor(acct), replace: true });
    } catch (err) {
      setErrors({ form: friendlyError(err) });
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Parents, guardians and students log in here." footer={<>New here? <Link to="/register" className="font-semibold text-primary underline">Create an account</Link></>}>
      {!firebaseConfigured && <div className="mb-5"><NotConfigured /></div>}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Email address" error={errors.email}><TextInput type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></Field>
        <Field label="Password" error={errors.password}><PasswordInput autoComplete="current-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></Field>
        <Link to="/forgot-password" className="-mt-1 justify-self-end text-sm font-semibold text-primary underline">Forgot password?</Link>
        {errors.form && <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{errors.form}</p>}
        <SubmitButton busy={busy} label="Logging in…">Log in</SubmitButton>
      </form>
    </AuthCard>
  );
}
