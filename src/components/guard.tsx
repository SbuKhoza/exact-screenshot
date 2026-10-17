import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { useAuth, homeFor } from "@/lib/auth";
import { logout } from "@/lib/services";
import type { Role } from "@/lib/services";
import { Logo } from "@/components/site/layout";
import { Button } from "@/components/ui/button";

export function Spinner() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

/** Client-side gate: redirects to login, or to the right page for the user's role/profile state. */
export function RequireAuth({ role, needsProfile, children }: { role: Role; needsProfile: boolean; children: ReactNode }) {
  const { loading, user, account } = useAuth();
  const navigate = useNavigate();
  const ok = !!user && !!account && account.role === role && (needsProfile ? account.profileCompleted : true);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (!ok) navigate({ to: homeFor(account), replace: true });
  }, [loading, user, account, ok, navigate]);

  if (loading || !ok) return <Spinner />;
  return <>{children}</>;
}

/** For login/registration pages: send signed-in users to their dashboard. */
export function useRedirectIfSignedIn(skip = false) {
  const { loading, account } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!skip && !loading && account) navigate({ to: homeFor(account), replace: true });
  }, [loading, account, navigate, skip]);
}

export function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  const navigate = useNavigate();
  const home = role === "parent" ? "/parent" : "/student";
  async function out() {
    await logout();
    navigate({ to: "/login", replace: true });
  }
  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-card">
        <div className="container-page grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Logo />
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><Link to={home} activeOptions={{ exact: true }} activeProps={{ className: "bg-accent" }}>Dashboard</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/account" activeProps={{ className: "bg-accent" }}>Account</Link></Button>
            <Button variant="outline" size="sm" onClick={out}><LogOut /> <span className="hidden sm:inline">Log out</span></Button>
          </nav>
        </div>
      </header>
      <main className="container-page py-10">{children}</main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending_review: ["Pending Review", "bg-warning/20 text-foreground"],
    contacted: ["Contacted", "bg-accent text-primary"],
    enrolled: ["Enrolled", "bg-success/20 text-foreground"],
    declined: ["Declined", "bg-destructive/15 text-destructive"],
  };
  const [label, cls] = map[status] ?? ["Pending Review", "bg-warning/20 text-foreground"];
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}
