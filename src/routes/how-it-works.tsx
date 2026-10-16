import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, PageIntro } from "@/components/site/layout";
import { HowItWorks, WhyUs } from "@/components/site/sections";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Sanele Sims Academy" },
      { name: "description", content: "Register online in three simple steps." },
      { property: "og:title", content: "How It Works — Sanele Sims Academy" },
      { property: "og:description", content: "Register online in three simple steps." },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <PublicPage>
      <PageIntro eyebrow="How It Works" title="How It Works">Register online in three simple steps.</PageIntro>
      <HowItWorks />
      <WhyUs />
    </PublicPage>
  );
}
