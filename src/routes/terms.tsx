import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, PageIntro } from "@/components/site/layout";
import { useSite } from "@/lib/site-content";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — SS Academy" },
      { name: "description", content: "Terms for using the SS Academy website and registering for tutoring." },
      { property: "og:title", content: "Terms and Conditions — SS Academy" },
      { property: "og:description", content: "Website and registration terms." },
    ],
  }),
  component: Terms,
});

function Terms() {
  const site = useSite();
  return (
    <PublicPage>
      <PageIntro eyebrow="Legal" title="Terms and Conditions" />
      <article className="container-page max-w-3xl space-y-5 py-14 text-muted-foreground">
        <p>Registering online is a request for tutoring. {site.name} will review each registration and contact you to confirm next steps. A registration is not a guaranteed placement.</p>
        <p>Please provide accurate information and keep your login details private. Full terms will be supplied by the academy.</p>
      </article>
    </PublicPage>
  );
}