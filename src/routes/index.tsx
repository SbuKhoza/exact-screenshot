import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/layout";
import { About, Contact, Hero, HowItWorks, Subjects, WhyUs } from "@/components/site/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sanele Sims Academy — Home Tutoring in South Africa" },
      { name: "description", content: "Empowering learners, one class at a time. Register your child or yourself for Maths, English, Web Development and Animation tutoring." },
      { property: "og:title", content: "Sanele Sims Academy — Home Tutoring" },
      { property: "og:description", content: "Empowering learners, one class at a time. Register online today." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicPage>
      <Hero />
      <About />
      <Subjects />
      <HowItWorks />
      <WhyUs />
      <Contact />
    </PublicPage>
  );
}
