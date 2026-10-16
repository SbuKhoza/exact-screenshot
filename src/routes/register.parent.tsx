import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "@/components/signup-form";

export const Route = createFileRoute("/register/parent")({
  head: () => ({
    meta: [
      { title: "Register Your Child — Sanele Sims Academy" },
      { name: "description", content: "Create a parent or guardian account to register your children for tutoring." },
      { property: "og:title", content: "Register Your Child — Sanele Sims Academy" },
      { property: "og:description", content: "Parent and guardian registration." },
    ],
  }),
  component: () => <SignupForm role="parent" />,
});
