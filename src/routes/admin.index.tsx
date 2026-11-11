import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Clock3, CheckCircle2, Mail, Search, RefreshCw, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { AdminGate, AdminShell } from "@/components/admin-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/guard";
import { useTenant } from "@/lib/tenant-context";
import { listAdminLearners, listAdminEnquiries, listAdminAccounts, setRegistrationStatus, setEnquiryStatus } from "@/lib/admin";
import { registrationStatuses, enquiryStatuses } from "@/lib/admin-access";
import { friendlyError } from "@/lib/firebase";
import { resetPassword } from "@/lib/services";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — SS Academy" }, { name: "description", content: "Manage learner registrations and contact form messages." }, { property: "og:title", content: "Admin Dashboard — SS Academy" }, { property: "og:description", content: "Tenant administration for SS Academy." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
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
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [resettingUid, setResettingUid] = useState("");
  const [resetNotice, setResetNotice] = useState<{ uid: string; text: string; failed: boolean } | null>(null);
  const rows = useQuery({ queryKey: ["admin-learners", tenantId], queryFn: () => tenantId ? listAdminLearners(tenantId) : [], enabled: !!tenantId, retry: false });
  const accounts = useQuery({ queryKey: ["admin-accounts", tenantId], queryFn: () => tenantId ? listAdminAccounts(tenantId) : [], enabled: !!tenantId, retry: false });
  const messages = useQuery({ queryKey: ["admin-enquiries", tenantId], queryFn: () => tenantId ? listAdminEnquiries(tenantId) : [], enabled: !!tenantId, retry: false });
  const learners = rows.data ?? [];
  const enquiries = messages.data ?? [];
  const visible = learners.filter(l => `${l.firstName} ${l.surname} ${l.schoolName}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || l.registrationStatus === filter));
  async function change(id: string, status: string, enquiry = false) {
    setBusyId(id); setError("");
    try { await (enquiry ? setEnquiryStatus(id, status) : setRegistrationStatus(id, status)); await client.invalidateQueries({ queryKey: [enquiry ? "admin-enquiries" : "admin-learners", tenantId] }); }
    catch (e) { setError(friendlyError(e)); } finally { setBusyId(""); }
  }
  async function sendResetLink(uid: string, email: string) {
    setResettingUid(uid);
    setResetNotice(null);
    try {
      await resetPassword(email);
      setResetNotice({ uid, text: `Password reset link sent to ${email}.`, failed: false });
    } catch (e) {
      setResetNotice({ uid, text: friendlyError(e), failed: true });
    } finally {
      setResettingUid("");
    }
  }
  function openEnquiry(id: string) {
    setSelectedEnquiryId(id);
    const enquiry = enquiries.find(item => item.id === id);
    if (enquiry?.status === "new") void change(id, "read", true);
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
    <Tabs defaultValue="learners"><TabsList><TabsTrigger value="learners">Learner registrations</TabsTrigger><TabsTrigger value="enquiries">Contact form messages</TabsTrigger><TabsTrigger value="accounts">User accounts</TabsTrigger></TabsList>
      <TabsContent value="learners" className="mt-6"><div className="mb-5 flex flex-wrap gap-3"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search learners" className="pl-9" placeholder="Search learners or schools" value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Filter registration status" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{registrationStatuses.map(s => <SelectItem key={s} value={s}>{labels[s]}</SelectItem>)}</SelectContent></Select></div>
        {rows.isPending ? <Loader2 aria-label="Loading learners" className="mx-auto my-10 animate-spin text-primary" /> : <div className="divide-y border-y">{visible.map(l => <article key={l.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{l.firstName} {l.surname}</h2><p className="mt-1 text-sm text-muted-foreground">{l.grade} · {l.schoolName}</p></div><StatusBadge status={l.registrationStatus} /></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p>{l.subjects?.map(s => s === "Other" ? l.otherSubject : s).join(", ")}</p><p className="break-words text-muted-foreground">{l.cellphoneNumber || "No learner phone"}{l.email ? ` · ${l.email}` : ""}</p></div>{l.changeRequest && <p className="mt-3 border-l-2 border-warning pl-3 text-sm">Change request: {l.changeRequest}</p>}<div className="mt-4"><StatusSelect value={l.registrationStatus} statuses={registrationStatuses} disabled={busyId === l.id} onChange={s => void change(l.id, s)} label={`Status for ${l.firstName} ${l.surname}`} /></div></article>)}{!visible.length && !rows.error && <p className="py-12 text-center text-sm text-muted-foreground">{search || filter !== "all" ? "No matching learners." : "No registrations for this tenant yet."}</p>}</div>}
      </TabsContent>
      <TabsContent value="enquiries" className="mt-6">
        {messages.isPending ? <Loader2 className="mx-auto my-10 animate-spin text-primary" /> : enquiries.length ? <div className="grid min-h-[30rem] overflow-hidden rounded-lg border bg-card md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)]">
          <section aria-label="Contact messages" className={`${selectedEnquiryId ? "hidden md:block" : "block"} border-r`}>
            <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-semibold">Inbox</h2><span className="text-sm text-muted-foreground">{enquiries.filter(e => e.status === "new").length} unread</span></div>
            <div className="divide-y">
              {enquiries.map(e => <Button key={e.id} type="button" variant="ghost" onClick={() => openEnquiry(e.id)} aria-pressed={selectedEnquiryId === e.id} className={`h-auto w-full justify-start whitespace-normal rounded-none px-4 py-4 text-left ${selectedEnquiryId === e.id ? "bg-accent" : ""}`}>
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className={`truncate text-sm ${e.status === "new" ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{e.name}</span>
                  <span className="truncate text-sm font-semibold text-foreground">{e.subject || "No subject"}</span>
                  <span className="line-clamp-2 text-xs font-normal text-muted-foreground">{e.message}</span>
                  <span className="text-xs font-normal text-muted-foreground">{e.email}</span>
                </span>
                {e.status === "new" && <span className="ml-2 mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </Button>)}
            </div>
          </section>
          <section aria-label="Message details" className={`${selectedEnquiryId ? "block" : "hidden md:flex"} min-w-0 flex-col`}>
            {(() => {
              const selected = enquiries.find(e => e.id === selectedEnquiryId);
              return selected ? <>
                <div className="border-b p-4 sm:p-6">
                  <Button type="button" variant="ghost" size="sm" className="mb-4 px-2 md:hidden" onClick={() => setSelectedEnquiryId(null)}><ArrowLeft />Back to inbox</Button>
                  <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 flex-1 break-words text-xl font-bold">{selected.subject || "No subject"}</h2><StatusBadge status={selected.status} /></div>
                  <div className="mt-5 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{selected.name}</p><p className="break-all text-sm text-muted-foreground">{selected.email}</p></div><Button asChild variant="outline" size="sm"><a href={`mailto:${selected.email}`}><Mail />Reply</a></Button></div>
                </div>
                <div className="min-h-48 flex-1 p-4 sm:p-6"><p className="whitespace-pre-wrap break-words text-sm leading-7">{selected.message}</p></div>
                <div className="border-t p-4"><StatusSelect value={selected.status} statuses={enquiryStatuses} disabled={busyId === selected.id} onChange={s => void change(selected.id, s, true)} label={`Status for enquiry from ${selected.name}`} /></div>
              </> : <div className="hidden h-full items-center justify-center p-8 text-center text-sm text-muted-foreground md:flex">Select a message to read it.</div>;
            })()}
          </section>
        </div> : !messages.error && <p className="border-y py-12 text-center text-sm text-muted-foreground">No enquiries for this tenant yet.</p>}
      </TabsContent>
      <TabsContent value="accounts" className="mt-6">
        <div className="mb-4"><h2 className="text-lg font-semibold">Tenant user accounts</h2><p className="mt-1 text-sm text-muted-foreground">Send a password reset link to a user’s email address. Their password is never shown or changed by the admin.</p></div>
        {accounts.isPending ? <Loader2 aria-label="Loading user accounts" className="mx-auto my-10 animate-spin text-primary" /> : accounts.error ? <p role="alert" className="border-y py-5 text-sm text-destructive">{friendlyError(accounts.error)} Check that the updated Firebase rules have been deployed.</p> : accounts.data?.length ? <div className="divide-y border-y">{accounts.data.map(account => <article key={account.uid} className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="break-all font-semibold">{account.email}</p><p className="mt-1 text-sm capitalize text-muted-foreground">{account.role}{account.profileCompleted ? " · Profile complete" : " · Profile incomplete"}</p></div><div className="flex min-w-48 flex-col items-start gap-2">{resetNotice?.uid === account.uid && <p role={resetNotice.failed ? "alert" : "status"} className={`text-sm ${resetNotice.failed ? "text-destructive" : "text-success"}`}>{resetNotice.text}</p>}<Button type="button" variant="outline" size="sm" disabled={!!resettingUid} onClick={() => void sendResetLink(account.uid, account.email)}>{resettingUid === account.uid ? <Loader2 className="animate-spin" /> : <KeyRound />}Send reset link</Button></div></article>)}</div> : <p className="border-y py-12 text-center text-sm text-muted-foreground">No user accounts are linked to this tenant yet.</p>}
      </TabsContent>
    </Tabs>
  </div>;
}
function StatusSelect({ value, statuses, disabled, onChange, label }: { value: string; statuses: readonly string[]; disabled: boolean; onChange: (s: string) => void; label: string }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger aria-label={label} className="w-44"><SelectValue /></SelectTrigger><SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{labels[s]}</SelectItem>)}</SelectContent></Select>;
}