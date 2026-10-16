import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, Field, SubmitButton, TextInput } from "@/components/forms";
import { friendlyError } from "@/lib/firebase";
import { resetPassword } from "@/lib/services";
import { email as emailRule } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — SS Academy" },
      { name: "description", content: "Get a link to reset your password." },
      { property: "og:title", content: "Reset Password — SS Academy" },
      { property: "og:description", content: "Reset your account password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = emailRule.safeParse(email);
    if (!r.success) return setError(r.error.issues[0].message);
    setError("");
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") setSent(true);
      else setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new password." footer={<Link to="/login" className="font-semibold text-primary underline">Back to login</Link>}>
      {sent ? (
        <p className="rounded-xl bg-accent p-4 text-primary">If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox and spam folder.</p>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-4">
          <Field label="Email address" error={error}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <SubmitButton busy={busy} label="Sending…">Send reset link</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
