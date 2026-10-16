import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, PageIntro } from "@/components/site/layout";
import { site } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Sanele Sims Academy" },
      { name: "description", content: "How Sanele Sims Academy collects and uses personal information, in line with POPIA." },
      { property: "og:title", content: "Privacy Policy — Sanele Sims Academy" },
      { property: "og:description", content: "How we handle your and your child's information." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <PublicPage>
      <PageIntro eyebrow="Legal" title="Privacy Policy" />
      <article className="container-page max-w-3xl space-y-5 py-14 text-muted-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary">
        <p>{site.name} respects your privacy and the privacy of the learners we support. This policy explains how we handle personal information in line with the Protection of Personal Information Act (POPIA). Please review it with the academy before relying on it.</p>
        <h2>What we collect</h2>
        <p>Parent/guardian name, email and cellphone number; and learner name, date of birth, optional phone number, subjects, grade and school name. We do not collect identity documents.</p>
        <h2>Why we collect it</h2>
        <p>Only to process tutoring registrations, plan lessons and contact you about next steps.</p>
        <h2>Who can see it</h2>
        <p>Only you and authorised academy staff. Learner details are never published on the website or shared for marketing.</p>
        <h2>Your rights</h2>
        <p>You may view and update your details in your dashboard, and ask us to correct or delete a registration at any time.</p>
        <h2>Contact</h2>
        <p>Email {site.email} or call {site.phone}.</p>
      </article>
    </PublicPage>
  );
}
