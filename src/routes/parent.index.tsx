import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Users, CheckCircle2 } from "lucide-react";
import { DashboardShell, RequireAuth, Spinner, StatusBadge } from "@/components/guard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/firebase";
import { getParentProfile, listChildren, type Learner, type ParentProfile } from "@/lib/services";

export const Route = createFileRoute("/parent/")({
  head: () => ({ meta: [{ title: "Parent Dashboard — SS Academy" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth role="parent" needsProfile>
      <DashboardShell role="parent"><Dashboard /></DashboardShell>
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [kids, setKids] = useState<Learner[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getParentProfile(user!.uid), listChildren(user!.uid)])
      .then(([p, k]) => { setProfile(p); setKids(k); })
      .catch((e) => setError(friendlyError(e)));
  }, [user]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!kids) return <Spinner />;

  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-muted-foreground">Welcome back,</p>
          <h1 className="truncate text-3xl font-extrabold text-primary md:text-4xl">{profile?.firstName}</h1>
        </div>
        <Button asChild variant="hero" size="lg"><Link to="/parent/children/new"><Plus /> Register a Child</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat icon={CheckCircle2} label="Profile" value="Complete" />
        <Stat icon={Users} label="Registered children" value={String(kids.length)} />
      </div>
      <section>
        <h2 className="text-xl font-bold text-primary">My children</h2>
        {kids.length === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
            <p className="font-semibold text-primary">No children registered yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Register your first child to get started.</p>
            <Button asChild className="mt-5 rounded-full"><Link to="/parent/children/new">Register a Child</Link></Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {kids.map((k) => (
              <Link key={k.id} to="/parent/children/$childId" params={{ childId: k.id }} className="rounded-2xl border border-border bg-card p-5 transition hover:shadow-soft">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <h3 className="truncate text-lg font-bold text-primary">{k.firstName} {k.surname}</h3>
                  <StatusBadge status={k.registrationStatus} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-muted-foreground">Grade</dt><dd className="font-semibold">{k.grade}</dd></div>
                  <div><dt className="text-muted-foreground">Date of birth</dt><dd className="font-semibold">{k.dateOfBirth}</dd></div>
                  <div className="col-span-2"><dt className="text-muted-foreground">School</dt><dd className="font-semibold">{k.schoolName}</dd></div>
                  <div className="col-span-2"><dt className="text-muted-foreground">Subjects</dt><dd className="font-semibold">{k.subjects.map((s) => (s === "Other" ? k.otherSubject : s)).join(", ")}</dd></div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
      <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold text-primary">{value}</p></div>
    </div>
  );
}
