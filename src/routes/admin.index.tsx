import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Clock3, CheckCircle2, Mail, Search, RefreshCw, Loader2 } from "lucide-react";
import { AdminGate, AdminShell } from "@/components/admin-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/guard";
import { useTenant } from "@/lib/tenant-context";
import { listAdminLearners, listAdminEnquiries, setRegistrationStatus, setEnquiryStatus } from "@/lib/admin";
import { registrationStatuses, enquiryStatuses } from "@/lib/admin-access";
import { friendlyError } from "@/lib/firebase";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — SS Academy" }, { name: "description", content: "Manage SS Academy learner registrations and enquiries." }, { property: "og:title", content: "Admin Dashboard — SS Academy" }, { property: "og:description", content: "Tenant administration for SS Academy." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminGate><AdminShell><Dashboard /></AdminShell></AdminGate>,
});
const labels: Record<string, string> = { pending_review: "Pending review", contacted: "Contacted", enrolled: "Enrolled", declined: "Declined", new: "New", read: "Read", resolved: "Resolved" };
function Dashboard() {
  const { tenantId, tenant } = useTenant();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const rows = useQuery({ queryKey: ["admin-learners", tenantId], queryFn: () => tenantId ? listAdminLearners(tenantId) : [], enabled: !!tenantId, retry: false });
  const messages = useQuery({ queryKey: ["admin-enquiries", tenantId], queryFn: () => tenantId ? listAdminEnquiries(tenantId) : [], enabled: !!tenantId, retry: false });
  const learners = rows.data ?? [];
  const enquiries = messages.data ?? [];
  const visible = learners.filter(l => `${l.firstName} ${l.surname} ${l.schoolName}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || l.registrationStatus === filter));
  async function change(id: string, status: string, enquiry = false) {
    setBusyId(id); setError("");
    try { await (enquiry ? setEnquiryStatus(id, status) : setRegistrationStatus(id, status)); await client.invalidateQueries({ queryKey: [enquiry ? "admin-enquiries" : "admin-learners", tenantId] }); }
    catch (e) { setError(friendlyError(e)); } finally { setBusyId(""); }
  }
  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-muted-foreground">{tenant?.businessName || "SS Academy"}</p><h1 className="mt-1 text-3xl font-bold">Overview</h1></div><Button variant="outline" size="icon" aria-label="Refresh dashboard" title="Refresh dashboard" onClick={() => { void rows.refetch(); void messages.refetch(); }}><RefreshCw className={rows.isFetching || messages.isFetching ? "animate-spin" : ""} /></Button></div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
      { label: "Learners", value: learners.length, icon: Users, color: "text-primary bg-accent" },
      { label: "Pending review", value: learners.filter(l => l.registrationStatus === "pending_review").length, icon: Clock3, color: "text-foreground bg-warning/15" },
      { label: "Enrolled", value: learners.filter(l => l.registrationStatus === "enrolled").length, icon: CheckCircle2, color: "text-success bg-success/10" },
      { label: "New enquiries", value: enquiries.filter(e => e.status === "new").length, icon: Mail, color: "text-highlight bg-highlight/10" },
    ].map(s => <div key={s.label} className="rounded-lg border bg-card p-4"><s.icon className={`mb-4 h-8 w-8 rounded-md p-1.5 ${s.color}`} /><p className="text-3xl font-bold">{rows.isPending || messages.isPending ? "—" : s.value}</p><p className="mt-1 text-sm text-muted-foreground">{s.label}</p></div>)}</div>
    {(error || rows.error || messages.error) && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error || friendlyError(rows.error || messages.error)} No records could be loaded. Please contact your superadmin if access has not been enabled.</p>}
    <Tabs defaultValue="learners"><TabsList><TabsTrigger value="learners">Learner registrations</TabsTrigger><TabsTrigger value="enquiries">Enquiries</TabsTrigger></TabsList>
      <TabsContent value="learners" className="mt-6"><div className="mb-5 flex flex-wrap gap-3"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search learners" className="pl-9" placeholder="Search learners or schools" value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Filter registration status" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{registrationStatuses.map(s => <SelectItem key={s} value={s}>{labels[s]}</SelectItem>)}</SelectContent></Select></div>
        {rows.isPending ? <Loader2 aria-label="Loading learners" className="mx-auto my-10 animate-spin text-primary" /> : <div className="divide-y border-y">{visible.map(l => <article key={l.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{l.firstName} {l.surname}</h2><p className="mt-1 text-sm text-muted-foreground">{l.grade} · {l.schoolName}</p></div><StatusBadge status={l.registrationStatus} /></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p>{l.subjects?.map(s => s === "Other" ? l.otherSubject : s).join(", ")}</p><p className="break-words text-muted-foreground">{l.cellphoneNumber || "No learner phone"}{l.email ? ` · ${l.email}` : ""}</p></div>{l.changeRequest && <p className="mt-3 border-l-2 border-warning pl-3 text-sm">Change request: {l.changeRequest}</p>}<div className="mt-4"><StatusSelect value={l.registrationStatus} statuses={registrationStatuses} disabled={busyId === l.id} onChange={s => void change(l.id, s)} label={`Status for ${l.firstName} ${l.surname}`} /></div></article>)}{!visible.length && !rows.error && <p className="py-12 text-center text-sm text-muted-foreground">{search || filter !== "all" ? "No matching learners." : "No registrations for this tenant yet."}</p>}</div>}
      </TabsContent>
      <TabsContent value="enquiries" className="mt-6">{messages.isPending ? <Loader2 className="mx-auto my-10 animate-spin text-primary" /> : <div className="divide-y border-y">{enquiries.map(e => <article key={e.id} className="py-5"><h2 className="font-bold">{e.subject}</h2><p className="mt-1 break-words text-sm text-muted-foreground">{e.name} · {e.email}</p><p className="my-4 whitespace-pre-wrap break-words text-sm">{e.message}</p><div className="flex flex-wrap items-center gap-3"><StatusSelect value={e.status} statuses={enquiryStatuses} disabled={busyId === e.id} onChange={s => void change(e.id, s, true)} label={`Status for enquiry from ${e.name}`} /><Button asChild variant="outline" size="sm"><a href={`mailto:${e.email}`}><Mail />Reply</a></Button></div></article>)}{!enquiries.length && !messages.error && <p className="py-12 text-center text-sm text-muted-foreground">No enquiries for this tenant yet.</p>}</div>}</TabsContent>
    </Tabs>
  </div>;
}
function StatusSelect({ value, statuses, disabled, onChange, label }: { value: string; statuses: readonly string[]; disabled: boolean; onChange: (s: string) => void; label: string }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger aria-label={label} className="w-44"><SelectValue /></SelectTrigger><SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{labels[s]}</SelectItem>)}</SelectContent></Select>;
}