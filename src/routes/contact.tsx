import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, PageIntro } from "@/components/site/layout";
import { Contact } from "@/components/site/sections";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — SS Academy" },
      { name: "description", content: "Call, email or message SS Academy about tutoring." },
      { property: "og:title", content: "Contact Us — SS Academy" },
      { property: "og:description", content: "Call, email or message SS Academy about tutoring." },
    ],
  }),
  component: ContactUsPage,
});

function ContactUsPage() {
  return (
    <PublicPage>
      <PageIntro eyebrow="Contact" title="Contact Us">Call, email or message SS Academy about tutoring.</PageIntro>
      <Contact />
    </PublicPage>
  );
}
