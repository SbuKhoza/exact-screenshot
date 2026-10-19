import { useEffect, type ReactNode } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, LayoutDashboard, UserRound, ArrowUpRight } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useAuth } from "@/lib/auth";
import { logout } from "@/lib/services";
import { Spinner } from "./guard";
import { Logo } from "./site/layout";
import { Button } from "./ui/button";

export function AdminGate({ children }: { children: ReactNode }) {
  const { loading, allowed } = useAdmin();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !allowed) void navigate({ to: "/admin/login", replace: true }); }, [loading, allowed, navigate]);
  if (loading || !allowed) return <Spinner />;
  return <>{children}</>;
}
export function AdminShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  async function out() {
    await client.cancelQueries();
    client.clear();
    await logout();
    await navigate({ to: "/admin/login", replace: true });
  }
  return <div className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="container-page flex min-h-20 flex-wrap items-center justify-between gap-3 py-3"><Logo /><div className="flex items-center gap-2"><span className="hidden max-w-64 truncate text-sm text-muted-foreground md:block">{user?.email}</span><Button variant="outline" size="sm" onClick={out}><LogOut />Sign out</Button></div></div></header>
    <div className="container-page grid gap-8 py-7 md:grid-cols-[190px_minmax(0,1fr)]">
      <nav aria-label="Admin navigation" className="flex flex-wrap gap-2 self-start md:sticky md:top-7 md:flex-col"><p className="hidden px-3 pb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:block">Administration</p>
        <Button asChild variant="ghost" className="justify-start"><Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-primary" }}><LayoutDashboard />Overview</Link></Button>
        <Button asChild variant="ghost" className="justify-start"><Link to="/admin/profile" activeProps={{ className: "bg-accent text-primary" }}><UserRound />My profile</Link></Button>
        <Button asChild variant="ghost" className="justify-start"><Link to="/"><ArrowUpRight />View website</Link></Button>
      </nav><main className="min-w-0">{children}</main>
    </div>
  </div>;
}