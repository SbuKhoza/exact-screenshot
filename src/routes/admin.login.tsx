import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";
import { AuthCard, Field, PasswordInput, TextInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/lib/admin-context";
import { useTenant } from "@/lib/tenant-context";
import { friendlyError } from "@/lib/firebase";
import { login, logout } from "@/lib/services";
import { canAdminTenant } from "@/lib/admin-access";
import { email, issues, type Errors } from "@/lib/validation";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Sign In — SS Academy" }, { name: "description", content: "Sign in to manage your SS Academy tenant." }, { property: "og:title", content: "Admin Sign In — SS Academy" }, { property: "og:description", content: "Secure administrator access for SS Academy." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});
const schema = z.object({ email, password: z.string().min(1, "Password is required") });
function AdminLogin() {
  const { allowed } = useAdmin();
  const { tenantId, tenant } = useTenant();
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
      if (!canAdminTenant(cred.user, tenantId, tenant)) {
        await client.cancelQueries(); client.clear(); await logout();
        setErrors({ form: "This account has not been assigned as administrator for this website." }); return;
      }
      setNotice("Signed in. Opening your dashboard…");
    } catch (e) { setErrors({ form: friendlyError(e) }); }
    finally { setBusy(false); }
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
  </AuthCard>;
}