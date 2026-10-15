import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { site, subjects } from "@/lib/site";
import { useAuth, homeFor } from "@/lib/auth";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/subjects", label: "Subjects" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <img src={logo.url} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full bg-card" />
      <span className={`truncate font-display text-lg font-bold leading-tight ${light ? "text-primary-foreground" : "text-primary"}`}>
        {site.name}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { account } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container-page grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Logo />
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
                {n.label}
              </Link>
            ))}
          </nav>
          {account ? (
            <Button asChild size="sm" className="hidden rounded-full sm:inline-flex">
              <Link to={homeFor(account)}>My dashboard</Link>
            </Button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/login">Login</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="rounded-full">Register <ChevronDown /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link to="/register/parent">I'm a Parent / Guardian</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/register/student">I'm a Student</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-semibold text-foreground hover:bg-muted">
                {n.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2">
              {account ? (
                <Button asChild><Link to={homeFor(account)}>My dashboard</Link></Button>
              ) : (
                <>
                  <Button asChild variant="outline"><Link to="/login">Login</Link></Button>
                  <Button asChild><Link to="/register/parent">Register your child</Link></Button>
                  <Button asChild variant="sky"><Link to="/register/student">Register as a student</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm text-primary-foreground/75">{site.short}</p>
        </div>
        <FooterCol title="Quick links">
          {nav.map((n) => <Link key={n.to} to={n.to} className="hover:underline">{n.label}</Link>)}
          <Link to="/login" className="hover:underline">Login</Link>
        </FooterCol>
        <FooterCol title="Subjects">
          {subjects.map((s) => <span key={s.id}>{s.name}</span>)}
        </FooterCol>
        <FooterCol title="Contact">
          <a href={site.phoneHref} className="hover:underline">{site.phone}</a>
          <a href={`mailto:${site.email}`} className="break-all hover:underline">{site.email}</a>
          <span>{site.location}</span>
        </FooterCol>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-primary-foreground/70 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
          <span className="flex gap-4">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms and Conditions</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">{title}</h3>
      <div className="mt-4 flex flex-col gap-2 text-sm text-primary-foreground/85">{children}</div>
    </div>
  );
}

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="bg-hero text-primary-foreground">
      <div className="container-page py-16 md:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-secondary">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold md:text-5xl">{title}</h1>
        {children && <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">{children}</p>}
      </div>
    </section>
  );
}
