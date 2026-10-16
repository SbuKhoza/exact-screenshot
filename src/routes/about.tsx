import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, PageIntro } from "@/components/site/layout";
import { About, WhyUs } from "@/components/site/sections";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Sanele Sims Academy" },
      { name: "description", content: "Quality tutoring in a safe, supportive and inspiring environment." },
      { property: "og:title", content: "About Us — Sanele Sims Academy" },
      { property: "og:description", content: "Quality tutoring in a safe, supportive and inspiring environment." },
    ],
  }),
  component: AboutUsPage,
});

function AboutUsPage() {
  return (
    <PublicPage>
      <PageIntro eyebrow="About" title="About Us">Quality tutoring in a safe, supportive and inspiring environment.</PageIntro>
      <About />
      <WhyUs />
    </PublicPage>
  );
}
