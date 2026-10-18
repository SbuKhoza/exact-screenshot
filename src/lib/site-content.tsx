import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { fb } from "./firebase";
import { site as defaultSite } from "./site";
import { useTenant } from "./tenant-context";

/** The shape every component reads. Same keys as the static `site` object in site.ts. */
export type SiteContent = {
  name: string;
  tagline: string;
  short: string;
  phone: string;
  phoneHref: string;
  email: string;
  location: string;
  whatsapp: string;
};

type Doc = Record<string, unknown>;

// Placeholder values that the CMS pre-fills. They must never override real defaults.
const PLACEHOLDER = /your company|your address|yourcompany\.com|goes here|0000 0000|^business logo$/i;

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  return v && !PLACEHOLDER.test(v) ? v : "";
}

function first(...values: unknown[]): string {
  for (const v of values) {
    const c = clean(v);
    if (c) return c;
  }
  return "";
}

/** "078 176 3322" -> "27781763322" (South African numbers). */
function toInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("27")) return digits;
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
}

export function buildSite(
  tenant: Record<string, unknown> | null,
  contact: Doc | null,
  footer: Doc | null,
  homepage: Doc | null,
): SiteContent {
  const phone = first(contact?.["phone"], footer?.["phone"], tenant?.["phone"]);
  const intl = toInternational(phone);
  return {
    name: first(tenant?.["businessName"], footer?.["companyName"]) || defaultSite.name,
    tagline: first(homepage?.["slogan"]) || defaultSite.tagline,
    short: first(homepage?.["shortDescription"], footer?.["companyDescription"]) || defaultSite.short,
    phone: phone || defaultSite.phone,
    phoneHref: intl ? `tel:+${intl}` : defaultSite.phoneHref,
    email: first(contact?.["email"], footer?.["email"], tenant?.["email"]) || defaultSite.email,
    location: first(contact?.["address"], footer?.["address"], tenant?.["address"]) || defaultSite.location,
    whatsapp: intl ? `https://wa.me/${intl}` : defaultSite.whatsapp,
  };
}

// Outside the provider (tests, error pages) components fall back to the static defaults.
const Ctx = createContext<SiteContent>({ ...defaultSite });

/**
 * Subscribes to the tenant's CMS documents and exposes them as `site`.
 * Mount this only when the tenant is active (TenantGate does that).
 */
export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { tenantId, tenant } = useTenant();
  const [contact, setContact] = useState<Doc | null>(null);
  const [footer, setFooter] = useState<Doc | null>(null);
  const [homepage, setHomepage] = useState<Doc | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const { db } = fb();
    const watch = (name: string, set: (d: Doc | null) => void) =>
      onSnapshot(
        doc(db, "tenants", tenantId, "data", name),
        (snap) => set(snap.exists() ? (snap.data() as Doc) : null),
        (err) => console.error(`Could not read tenant data/${name}:`, err),
      );
    const unsubs = [watch("contactPage", setContact), watch("footer", setFooter), watch("homepage", setHomepage)];
    return () => unsubs.forEach((u) => u());
  }, [tenantId]);

  const value = useMemo(
    () => buildSite(tenant as Record<string, unknown> | null, contact, footer, homepage),
    [tenant, contact, footer, homepage],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSite = () => useContext(Ctx);