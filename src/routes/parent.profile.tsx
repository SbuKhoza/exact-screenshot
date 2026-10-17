import type { Errors } from "@/lib/validation";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthCard, Field, SubmitButton, TextInput } from "@/components/forms";
import { RequireAuth, Spinner } from "@/components/guard";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/firebase";
import { getParentProfile, saveParentProfile } from "@/lib/services";
import { issues, parentProfileSchema } from "@/lib/validation";

export const Route = createFileRoute("/parent/profile")({
  head: () => ({ meta: [{ title: "Your Profile — SS Academy" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth role="parent" needsProfile={false}><ProfileForm /></RequireAuth>
  ),
});

function ProfileForm() {
  const { user, account, refresh } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState<{ firstName: string; surname: string; cellphone: string } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const editing = account?.profileCompleted;

  useEffect(() => {
    getParentProfile(user!.uid)
      .then((p) => setV({ firstName: p?.firstName ?? "", surname: p?.surname ?? "", cellphone: p?.cellphoneNumber ?? "" }))
      .catch(() => setV({ firstName: "", surname: "", cellphone: "" }));
  }, [user]);

  if (!v) return <Spinner />;
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !v) return;
    const r = parentProfileSchema.safeParse(v);
    if (!r.success) return setErrors(issues(r.error));
    setErrors({});
    setBusy(true);
    try {
      await saveParentProfile(user!.uid, user!.email!, r.data);
      await refresh();
      toast.success(editing ? "Profile updated" : "Profile complete! You can now register your children.");
      navigate({ to: "/parent" });
    } catch (err) {
      toast.error(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <AuthCard step={editing ? undefined : "Step 2 of 2"} title={editing ? "Edit your profile" : "Complete your profile"} subtitle="We'll use these details to contact you about your child's tutoring.">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Email (login)"><TextInput value={user?.email ?? ""} readOnly disabled /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName}><TextInput autoComplete="given-name" value={v.firstName} onChange={set("firstName")} /></Field>
          <Field label="Surname" error={errors.surname}><TextInput autoComplete="family-name" value={v.surname} onChange={set("surname")} /></Field>
        </div>
        <Field label="Cellphone number" error={errors.cellphone}><TextInput type="tel" value={v.cellphone} onChange={set("cellphone")} /></Field>
        <SubmitButton busy={busy} label="Saving…">{editing ? "Save changes" : "Save and continue"}</SubmitButton>
      </form>
    </AuthCard>
  );
}
