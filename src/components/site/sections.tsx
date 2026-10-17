import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Box, Calculator, Code2, Sigma, HeartHandshake, TrendingUp, Home, GraduationCap, MousePointerClick, Sparkles, Phone, Mail, MapPin, MessageCircle, UserPlus, ClipboardCheck, PhoneCall } from "lucide-react";
import hero from "@/assets/hero.jpg";
import online from "@/assets/online.jpg";
import { Button } from "@/components/ui/button";
import { site, subjects } from "@/lib/site";
import { contactSchema, issues } from "@/lib/validation";
import { sendContactMessage } from "@/lib/services";
import { friendlyError } from "@/lib/firebase";
import { Field, TextInput, TextArea } from "@/components/forms";

const icons = { Sigma, Calculator, BookOpen, Code2, Box } as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero text-primary-foreground">
      <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-semibold">
            <Home className="h-4 w-4" /> In the comfort of your child's home
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] md:text-6xl">
            Empowering learners, <span className="text-highlight">one class</span> at a time.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-primary-foreground/80">
            Personalised tutoring that helps learners grow in understanding, confidence and results — in a safe, supportive and inspiring environment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg"><Link to="/register/parent">Register Your Child</Link></Button>
            <Button asChild variant="onDark" size="lg"><Link to="/register/student">Register as a Student</Link></Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rotate-3 rounded-[2rem] bg-secondary/40" aria-hidden />
          <img src={hero} alt="A tutor helping a learner with her maths homework at home" width={1280} height={1024} className="relative aspect-[5/4] w-full rounded-[2rem] object-cover shadow-soft" />
        </div>
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-widest text-highlight">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold text-primary md:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-lg text-muted-foreground">{children}</p>}
    </div>
  );
}

export function About() {
  const points = [
    { icon: Sparkles, t: "Personalised learning", d: "Lessons shaped around each learner's pace and needs." },
    { icon: GraduationCap, t: "Academic support", d: "Help with homework, tests and exam preparation." },
    { icon: HeartHandshake, t: "Confidence building", d: "Encouragement that helps learners believe in themselves." },
    { icon: TrendingUp, t: "Student development", d: "Skills and study habits that last beyond the classroom." },
  ];
  return (
    <section className="py-20">
      <div className="container-page grid items-center gap-12 md:grid-cols-2">
        <img src={online} alt="A learner taking part in an online lesson at home" width={1024} height={1024} loading="lazy" className="aspect-square w-full rounded-[2rem] object-cover shadow-soft" />
        <div>
          <SectionHead eyebrow="About us" title={`Welcome to ${site.name}`}>
            We strive to provide quality education in a safe, supportive and inspiring environment, helping every learner improve their academic performance.
          </SectionHead>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {points.map((p) => (
              <div key={p.t} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><p.icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="font-bold text-primary">{p.t}</h3>
                  <p className="text-sm text-muted-foreground">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Subjects() {
  return (
    <section className="bg-muted py-20">
      <div className="container-page">
        <SectionHead eyebrow="Subjects" title="Subjects we offer" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const Icon = icons[s.icon as keyof typeof icons] ?? BookOpen;
            return (
              <div key={s.id} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-soft">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-xl font-bold text-primary">{s.name}</h3>
                <p className="mt-2 text-muted-foreground">{s.blurb}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: UserPlus, t: "Create an account", d: "Sign up as a parent/guardian or as an independent student." },
    { icon: ClipboardCheck, t: "Complete your profile", d: "Add your details and register your child — or yourself." },
    { icon: PhoneCall, t: "We'll be in touch", d: "We review the registration and contact you with the next steps." },
  ];
  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHead eyebrow="How it works" title="Three simple steps" />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.t} className="relative rounded-2xl border border-border bg-card p-7">
              <span className="font-display text-5xl font-extrabold text-accent">{i + 1}</span>
              <s.icon className="absolute right-6 top-7 h-7 w-7 text-secondary" />
              <h3 className="mt-2 text-xl font-bold text-primary">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/register/parent">Register Your Child</Link></Button>
          <Button asChild variant="sky" size="lg"><Link to="/register/student">Register as a Student</Link></Button>
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  const items = [
    { icon: Sparkles, t: "Personalised learning support" },
    { icon: TrendingUp, t: "Focus on academic improvement" },
    { icon: HeartHandshake, t: "A supportive learning environment" },
    { icon: GraduationCap, t: "Dedicated, caring tutors" },
    { icon: MousePointerClick, t: "Convenient online registration" },
    { icon: Home, t: "Lessons in the comfort of home" },
  ];
  return (
    <section className="bg-primary py-20 text-primary-foreground">
      <div className="container-page">
        <p className="text-sm font-bold uppercase tracking-widest text-secondary">Why choose us</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold md:text-4xl">Helping learners grow in confidence</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.t} className="flex items-center gap-4 rounded-2xl bg-primary-foreground/5 p-5 ring-1 ring-primary-foreground/10">
              <i.icon className="h-6 w-6 shrink-0 text-secondary" />
              <span className="font-semibold">{i.t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const [v, setV] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const r = contactSchema.safeParse(v);
    if (!r.success) return setErrors(issues(r.error));
    setErrors({});
    setBusy(true);
    try {
      await sendContactMessage(r.data);
      toast.success("Thanks! Your message has been sent.");
      setV({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const info = [
    { icon: Phone, label: site.phone, href: site.phoneHref },
    { icon: Mail, label: site.email, href: `mailto:${site.email}` },
    { icon: MessageCircle, label: "Chat on WhatsApp", href: site.whatsapp },
    { icon: MapPin, label: site.location },
  ];
  return (
    <section className="py-20">
      <div className="container-page grid gap-12 md:grid-cols-[1fr_1.3fr]">
        <div>
          <SectionHead eyebrow="Contact us" title="We'd love to hear from you">
            Questions about lessons or registration? Get in touch.
          </SectionHead>
          <ul className="mt-8 space-y-4">
            {info.map((i) => (
              <li key={i.label} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><i.icon className="h-5 w-5" /></span>
                {i.href ? <a href={i.href} className="min-w-0 break-all font-semibold text-primary hover:underline">{i.label}</a> : <span className="font-semibold text-primary">{i.label}</span>}
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}><TextInput value={v.name} onChange={set("name")} autoComplete="name" /></Field>
            <Field label="Email" error={errors.email}><TextInput type="email" value={v.email} onChange={set("email")} autoComplete="email" /></Field>
          </div>
          <Field label="Subject" error={errors.subject}><TextInput value={v.subject} onChange={set("subject")} /></Field>
          <Field label="Message" error={errors.message}><TextArea rows={5} value={v.message} onChange={set("message")} /></Field>
          <Button type="submit" size="lg" disabled={busy} className="justify-self-start">{busy ? "Sending…" : "Send message"}</Button>
        </form>
      </div>
    </section>
  );
}
