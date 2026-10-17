import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grades, OTHER_SUBJECT, subjects } from "@/lib/site";
import { Logo } from "@/components/site/layout";

export function Field({ label, error, hint, children, optional }: { label: string; error?: string | undefined; hint?: string; optional?: boolean; children: ReactNode }) {
  const id = useId();
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { id, "aria-invalid": !!error || undefined, "aria-describedby": error ? `${id}-err` : undefined })
    : children;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </label>
      {child}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

export const TextInput = (p: React.ComponentProps<typeof Input>) => <Input className="h-11 bg-card" {...p} />;
export const TextArea = (p: React.ComponentProps<typeof Textarea>) => <Textarea className="bg-card" {...p} />;

export function PasswordInput(p: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...p} type={show ? "text" : "password"} className="h-11 bg-card pr-11" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function GradeSelect({ value, onChange, id, ...rest }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-11 bg-card" {...rest}><SelectValue placeholder="Select a grade" /></SelectTrigger>
      <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
    </Select>
  );
}

export function SubjectPicker({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string | undefined }) {
  const all = [...subjects.map((s) => s.name), OTHER_SUBJECT];
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">Subject(s)</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {all.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-card px-3 py-2.5 text-sm has-[:checked]:border-secondary has-[:checked]:bg-accent">
            <Checkbox checked={value.includes(s)} onCheckedChange={() => toggle(s)} />
            {s}
          </label>
        ))}
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </fieldset>
  );
}

export function Consent({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string | undefined }) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" />
        <span>
          I have read the <Link to="/privacy" target="_blank" className="font-semibold text-primary underline">Privacy Policy</Link> and consent to {""}
          the academy using these details to process the registration and contact me, in line with POPIA.
        </span>
      </label>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function SubmitButton({ busy, children, label }: { busy: boolean; children: ReactNode; label?: string }) {
  return (
    <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-60">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {busy ? label ?? "Please wait…" : children}
    </button>
  );
}

export function AuthCard({ title, subtitle, children, footer, step }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; step?: string }) {
  return (
    <div className="min-h-screen bg-muted">
      <div className="container-page flex h-16 items-center"><Logo /></div>
      <div className="container-page flex justify-center pb-16 pt-6">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft md:p-9">
          {step && <p className="text-xs font-bold uppercase tracking-widest text-highlight">{step}</p>}
          <h1 className="mt-1 text-3xl font-extrabold text-primary">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function NotConfigured() {
  return (
    <div className="rounded-xl border border-warning bg-warning/10 p-4 text-sm text-foreground">
      Online accounts aren't connected yet. Please contact us by phone or email in the meantime.
    </div>
  );
}
