import { createFileRoute } from "@tanstack/react-router";
import { SignupForm } from "@/components/signup-form";

export const Route = createFileRoute("/register/student")({
  head: () => ({
    meta: [
      { title: "Register as a Student — SS Academy" },
      { name: "description", content: "Independent students can register for tutoring with their own account." },
      { property: "og:title", content: "Register as a Student — SS Academy" },
      { property: "og:description", content: "Independent student registration." },
    ],
  }),
  component: () => <SignupForm role="student" />,
});
