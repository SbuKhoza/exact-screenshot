import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { AdminGate, AdminShell } from "@/components/admin-gate";
import { Field, TextInput } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTenant } from "@/lib/tenant-context";
import { getAdminProfile, saveAdminProfile, type AdminProfile } from "@/lib/admin";
import { friendlyError } from "@/lib/firebase";
import { optionalCell } from "@/lib/validation";
import { z } from "zod";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Admin Profile — SS Academy" }, { name: "description", content: "Manage your SS Academy administrator profile." }, { property: "og:title", content: "Admin Profile — SS Academy" }, { property: "og:description", content: "Your tenant administrator contact details." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminGate><AdminShell><Profile /></AdminShell></AdminGate>,
});
function Profile() {
  const { user } = useAuth(); const { tenantId } = useTenant();
  const data = useQuery({ queryKey: ["admin-profile", tenantId, user?.uid], queryFn: () => user && tenantId ? getAdminProfile(tenantId, user.uid) : null, retry: false });
  if (data.isPending) return <Loader2 className="animate-spin text-primary" />;
  if (data.error) return <p role="alert" className="text-destructive">{friendlyError(data.error)}</p>;
  return <ProfileForm initial={data.data ?? { displayName: "", cellphoneNumber: "" }} />;
}
function ProfileForm({ initial }: { initial: AdminProfile }) {
  const [v, setV] = useState(initial); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  const { user } = useAuth(); const { tenantId } = useTenant(); const client = useQueryClient();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!user || !tenantId) return;
    const result = z.object({ displayName: z.string().trim().min(1, "Display name is required").max(60), cellphoneNumber: optionalCell }).safeParse(v);
    if (!result.success) return setError(result.error.issues[0]?.message ?? "Check your details");
    setBusy(true); setError(""); setSaved(false);
    try { await saveAdminProfile(tenantId, user.uid, result.data); await client.invalidateQueries({ queryKey: ["admin-profile"] }); setSaved(true); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }
  return <div className="max-w-xl"><h1 className="text-3xl font-bold">My profile</h1><p className="mt-2 break-words text-sm text-muted-foreground">{user?.email}</p><form onSubmit={submit} noValidate className="mt-8 grid gap-5"><Field label="Display name"><TextInput maxLength={60} autoComplete="name" value={v.displayName} onChange={e => { setSaved(false); setV({ ...v, displayName: e.target.value }); }} /></Field><Field label="Cellphone number" optional><TextInput maxLength={20} type="tel" value={v.cellphoneNumber} onChange={e => { setSaved(false); setV({ ...v, cellphoneNumber: e.target.value }); }} /></Field>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{saved && <p role="status" className="text-sm text-success">Profile saved.</p>}<Button disabled={busy} type="submit" className="justify-self-start">{busy ? <Loader2 className="animate-spin" /> : <Save />}Save profile</Button></form></div>;
}