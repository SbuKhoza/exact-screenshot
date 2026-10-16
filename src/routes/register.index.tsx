import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Users } from "lucide-react";
import { AuthCard } from "@/components/forms";
import { useRedirectIfSignedIn } from "@/components/guard";

export const Route = createFileRoute("/register/")({
  head: () => ({
    meta: [
      { title: "Register — Sanele Sims Academy" },
      { name: "description", content: "Register as a parent/guardian or as an independent student." },
      { property: "og:title", content: "Register — Sanele Sims Academy" },
      { property: "og:description", content: "Choose how you'd like to register." },
    ],
  }),
  component: Choose,
});

function Choose() {
  useRedirectIfSignedIn();
  const opts = [
    { to: "/register/parent" as const, icon: Users, t: "I'm a Parent / Guardian", d: "Create an account and register one or more children." },
    { to: "/register/student" as const, icon: GraduationCap, t: "I'm a Student", d: "Register yourself with your own email and password." },
  ];
  return (
    <AuthCard title="Create an account" subtitle="Who is registering?" footer={<>Already registered? <Link to="/login" className="font-semibold text-primary underline">Log in</Link></>}>
      <div className="grid gap-4">
        {opts.map((o) => (
          <Link key={o.to} to={o.to} className="flex items-center gap-4 rounded-2xl border-2 border-border p-5 transition hover:border-secondary hover:bg-accent">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><o.icon className="h-6 w-6" /></span>
            <span className="min-w-0">
              <span className="block text-lg font-bold text-primary">{o.t}</span>
              <span className="block text-sm text-muted-foreground">{o.d}</span>
            </span>
          </Link>
        ))}
      </div>
    </AuthCard>
  );
}
