import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, PageIntro } from "@/components/site/layout";
import { Subjects, HowItWorks } from "@/components/site/sections";

export const Route = createFileRoute("/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — SS Academy" },
      { name: "description", content: "Mathematics, Maths Literacy, English, Website Development and Computer Animation tutoring." },
      { property: "og:title", content: "Subjects — SS Academy" },
      { property: "og:description", content: "Mathematics, Maths Literacy, English, Website Development and Computer Animation tutoring." },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  return (
    <PublicPage>
      <PageIntro eyebrow="Subjects" title="Subjects">Mathematics, Maths Literacy, English, Website Development and Computer Animation tutoring.</PageIntro>
      <Subjects />
      <HowItWorks />
    </PublicPage>
  );
}
