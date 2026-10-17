import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { DashboardShell, RequireAuth, Spinner, StatusBadge } from "@/components/guard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/firebase";
import { getLearner, type Learner } from "@/lib/services";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Student Dashboard — SS Academy" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth role="student" needsProfile>
      <DashboardShell role="student"><Dashboard /></DashboardShell>
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState<Learner | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getLearner(user!.uid).then(setS).catch((e) => setError(friendlyError(e)));
  }, [user]);
  if (error) return <p className="text-destructive">{error}</p>;
  if (!s) return <Spinner />;

  const rows: [string, string][] = [
    ["Email", user?.email ?? ""],
    ["Cellphone", s.cellphoneNumber],
    ["Date of birth", s.dateOfBirth],
    ["Grade", s.grade],
    ["School", s.schoolName],
    ["Subjects", s.subjects.map((x) => (x === "Other" ? s.otherSubject : x)).join(", ")],
  ];
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="font-semibold text-muted-foreground">Welcome,</p>
        <h1 className="text-3xl font-extrabold text-primary md:text-4xl">{s.firstName} {s.surname}</h1>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-sm text-muted-foreground">Registration status</span>
            <StatusBadge status={s.registrationStatus} />
          </div>
          <Button asChild variant="outline"><Link to="/student/details"><Pencil /> Edit</Link></Button>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="min-w-0"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="break-words font-semibold">{v}</dd></div>
          ))}
        </dl>
      </div>
    </div>
  );
}
