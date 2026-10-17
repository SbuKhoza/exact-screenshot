import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell, Spinner } from "@/components/guard";
import { Field, PasswordInput, SubmitButton, TextInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/firebase";
import { changePassword } from "@/lib/services";
import { issues, password } from "@/lib/validation";
import { RequireAnyAuth } from "@/components/require-any";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account Settings — SS Academy" }, { name: "robots", content: "noindex" }] }),
  component: () => <RequireAnyAuth><Account /></RequireAnyAuth>,
});

const schema = z
  .object({ current: z.string().min(1, "Enter your current password"), next: password, confirm: z.string() })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

function Account() {
  const { user, account } = useAuth();
  const [v, setV] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  if (!account) return <Spinner />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const r = schema.safeParse(v);
    if (!r.success) return setErrors(issues(r.error));
    setErrors({});
    setBusy(true);
    try {
      await changePassword(v.current, v.next);
      toast.success("Password changed");
      setV({ current: "", next: "", confirm: "" });
    } catch (err) {
      setErrors({ current: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell role={account.role}>
      <div className="mx-auto grid max-w-2xl gap-6">
        <h1 className="text-3xl font-extrabold text-primary">Account settings</h1>
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-primary">Profile</h2>
          <div className="mt-4 grid gap-4">
            <Field label="Login email"><TextInput value={user?.email ?? ""} readOnly disabled /></Field>
            <Button asChild variant="outline" className="justify-self-start">
              <Link to={account.role === "parent" ? "/parent/profile" : "/student/details"}>Edit my details</Link>
            </Button>
          </div>
        </section>
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-primary">Change password</h2>
          <form onSubmit={submit} noValidate className="mt-4 grid gap-4">
            <Field label="Current password" error={errors.current}><PasswordInput autoComplete="current-password" value={v.current} onChange={(e) => setV({ ...v, current: e.target.value })} /></Field>
            <Field label="New password" hint="At least 8 characters, with a letter and a number." error={errors.next}><PasswordInput autoComplete="new-password" value={v.next} onChange={(e) => setV({ ...v, next: e.target.value })} /></Field>
            <Field label="Confirm new password" error={errors.confirm}><PasswordInput autoComplete="new-password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} /></Field>
            <SubmitButton busy={busy} label="Updating…">Update password</SubmitButton>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}
