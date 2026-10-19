import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";
import { AuthCard, Field, PasswordInput, TextInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/lib/admin-context";
import { useAuth } from "@/lib/auth";
import { useTenant } from "@/lib/tenant-context";
import { fb, friendlyError } from "@/lib/firebase";
import { login, logout } from "@/lib/services";
import { canAdminTenant } from "@/lib/admin-access";
import { verifyAdminEmail } from "@/lib/admin";
import { email, issues, type Errors } from "@/lib/validation";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Sign In — SS Academy" }, { name: "description", content: "Sign in to manage your SS Academy tenant." }, { property: "og:title", content: "Admin Sign In — SS Academy" }, { property: "og:description", content: "Secure administrator access for SS Academy." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});
const schema = z.object({ email, password: z.string().min(1, "Password is required") });
function AdminLogin() {
  const { allowed } = useAdmin();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [v, setV] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState("");
  useEffect(() => { if (allowed) void navigate({ to: "/admin", replace: true }); }, [allowed, navigate]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(v);
    if (!result.success) return setErrors(issues(result.error));
    setBusy(true); setErrors({}); setNotice("");
    try {
      const cred = await login(result.data.email, result.data.password);
      await cred.user.reload();
      if (!cred.user.emailVerified) { setNotice("Confirm your email address before accessing administration."); return; }
      if (!canAdminTenant(cred.user, tenant)) {
        await client.cancelQueries(); client.clear(); await logout();
        setErrors({ form: "This account has not been assigned as administrator for this website." }); return;
      }
      await client.invalidateQueries({ queryKey: ["admin-access"] });
      setNotice("Checking administrator access… If access is denied, contact your superadmin.");
    } catch (e) { setErrors({ form: friendlyError(e) }); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true);
    try { await verifyAdminEmail(); setNotice("Verification email sent. Open the link, then check again."); } catch (e) { setErrors({ form: friendlyError(e) }); } finally { setBusy(false); }
  }
  async function recheck() {
    setBusy(true);
    try { await fb().auth.currentUser?.reload(); await fb().auth.currentUser?.getIdToken(true); window.location.reload(); } catch (e) { setErrors({ form: friendlyError(e) }); setBusy(false); }
  }
  return <AuthCard title="Admin sign in" subtitle={tenant?.businessName || "SS Academy"} footer={<Link to="/login" className="font-semibold text-primary underline">Parent or student login</Link>}>
    <div className="mb-6 flex items-center gap-3 border-b pb-5 text-sm text-muted-foreground"><ShieldCheck className="h-6 w-6 shrink-0 text-primary" /><span>Administrator access</span></div>
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <Field label="Email address" error={errors.email}><TextInput type="email" autoComplete="email" value={v.email} onChange={e => setV({ ...v, email: e.target.value })} /></Field>
      <Field label="Password" error={errors.password}><PasswordInput autoComplete="current-password" value={v.password} onChange={e => setV({ ...v, password: e.target.value })} /></Field>
      <Link to="/forgot-password" className="justify-self-end text-sm font-semibold text-primary underline">Forgot password?</Link>
      {errors.form && <p role="alert" className="text-sm text-destructive">{errors.form}</p>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      <Button type="submit" disabled={busy} className="h-11">{busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}Sign in</Button>
    </form>
    {user && !user.emailVerified && <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={verify}>Send verification email</Button><Button variant="ghost" disabled={busy} onClick={recheck}>Check again</Button></div>}
  </AuthCard>;
}