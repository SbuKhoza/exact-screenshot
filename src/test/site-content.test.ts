import { describe, expect, it } from "vitest";
import { buildSite } from "@/lib/site-content";
import { site } from "@/lib/site";
import { isTenantActive } from "@/lib/tenant";

describe("buildSite", () => {
  it("falls back to the static defaults when the CMS has nothing", () => {
    expect(buildSite(null, null, null, null)).toEqual(site);
  });

  it("uses CMS values and derives tel/WhatsApp links from the phone number", () => {
    const result = buildSite(
      { businessName: "Acme Plumbing" },
      { phone: "082 555 1234", email: "hi@acme.co.za", address: "1 Main Rd" },
      null,
      { slogan: "We fix it" },
    );
    expect(result.name).toBe("Acme Plumbing");
    expect(result.tagline).toBe("We fix it");
    expect(result.phoneHref).toBe("tel:+27825551234");
    expect(result.whatsapp).toBe("https://wa.me/27825551234");
    expect(result.email).toBe("hi@acme.co.za");
    expect(result.location).toBe("1 Main Rd");
  });

  it("ignores the placeholder values the CMS pre-fills", () => {
    const result = buildSite(null, null, { address: "Your Address Here", email: "info@yourcompany.com" }, null);
    expect(result.location).toBe(site.location);
    expect(result.email).toBe(site.email);
  });
});

describe("isTenantActive", () => {
  it("is active unless isActive is explicitly false", () => {
    expect(isTenantActive({})).toBe(true);
    expect(isTenantActive({ isActive: true })).toBe(true);
    expect(isTenantActive({ isActive: false })).toBe(false);
    expect(isTenantActive(null)).toBe(true);
  });
});