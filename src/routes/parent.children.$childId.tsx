import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";
import { DashboardShell, RequireAuth, Spinner, StatusBadge } from "@/components/guard";
import { LearnerForm } from "@/components/learner-form";
import { TextArea } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/firebase";
import { getLearner, requestChange, updateLearner, type Learner } from "@/lib/services";

export const Route = createFileRoute("/parent/children/$childId")({
  head: () => ({ meta: [{ title: "Child Registration — SS Academy" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth role="parent" needsProfile>
      <DashboardShell role="parent"><Child /></DashboardShell>
    </RequireAuth>
  ),
});

function Child() {
  const { childId } = Route.useParams();
  const { user } = useAuth();
  const [kid, setKid] = useState<Learner | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getLearner(childId).then((k) => setKid(k && k.parentUid === user!.uid ? k : null)).catch(() => setKid(null));
  }, [childId, user]);

  if (kid === undefined) return <Spinner />;
  if (kid === null) return <p className="text-muted-foreground">This registration could not be found. <Link to="/parent" className="underline">Back to dashboard</Link></p>;

  const rows: [string, string][] = [
    ["Date of birth", kid.dateOfBirth],
    ["Phone number", kid.cellphoneNumber || "—"],
    ["Grade", kid.grade],
    ["School", kid.schoolName],
    ["Subjects", kid.subjects.map((s) => (s === "Other" ? kid.otherSubject : s)).join(", ")],
  ];

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <Link to="/parent" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-9">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-extrabold text-primary">{kid.firstName} {kid.surname}</h1>
            <div className="mt-2"><StatusBadge status={kid.registrationStatus} /></div>
          </div>
          {!editing && <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit</Button>}
        </div>
        <div className="mt-7">
          {editing ? (
            <LearnerForm
              mode="child"
              submitLabel="Save changes"
              initial={{ firstName: kid.firstName, surname: kid.surname, dateOfBirth: kid.dateOfBirth, cellphone: kid.cellphoneNumber, subjects: kid.subjects, otherSubject: kid.otherSubject, grade: kid.grade, schoolName: kid.schoolName }}
              onSubmit={async (v) => {
                try {
                  await updateLearner(kid.id, v);
                  setKid(await getLearner(kid.id));
                  setEditing(false);
                  toast.success("Details updated");
                } catch (e) {
                  toast.error(friendlyError(e));
                }
              }}
            />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}><dt className="text-sm text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
          )}
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-primary">Request a correction or removal</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us what should change, or that you'd like this registration removed.</p>
        {kid.changeRequest && <p className="mt-3 rounded-lg bg-accent p-3 text-sm">Last request: {kid.changeRequest}</p>}
        <TextArea className="mt-4 bg-card" rows={3} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
        <Button
          className="mt-3 rounded-full"
          disabled={sending || !note.trim()}
          onClick={async () => {
            setSending(true);
            try {
              await requestChange(kid.id, note);
              setKid({ ...kid, changeRequest: note.trim() });
              setNote("");
              toast.success("Request sent. We'll be in touch.");
            } catch (e) {
              toast.error(friendlyError(e));
            } finally {
              setSending(false);
            }
          }}
        >
          {sending ? "Sending…" : "Send request"}
        </Button>
      </div>
    </div>
  );
}
