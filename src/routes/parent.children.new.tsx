import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell, RequireAuth } from "@/components/guard";
import { LearnerForm } from "@/components/learner-form";
import { Consent } from "@/components/forms";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/firebase";
import { addChild } from "@/lib/services";

export const Route = createFileRoute("/parent/children/new")({
  head: () => ({ meta: [{ title: "Register a Child — SS Academy" }, { name: "description", content: "Add a learner to your SS Academy parent account." }, { property: "og:title", content: "Register a Child — SS Academy" }, { property: "og:description", content: "Register a learner for tutoring from your parent account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth role="parent" needsProfile>
      <DashboardShell role="parent"><NewChild /></DashboardShell>
    </RequireAuth>
  ),
});

function NewChild() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(false);
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-soft md:p-9">
      <h1 className="text-3xl font-extrabold text-primary">Register a child</h1>
      <p className="mt-2 text-muted-foreground">Your child doesn't need their own login — you'll manage everything from your dashboard.</p>
      <div className="mt-7">
        <LearnerForm
          mode="child"
          submitLabel="Register child"
          extra={<Consent checked={consent} onChange={setConsent} />}
          extraValid={() => (consent ? null : "Please accept the privacy policy to continue")}
          onSubmit={async (v) => {
            try {
              const id = await addChild(user!.uid, v);
              toast.success(`${v.firstName} has been registered!`);
              navigate({ to: "/parent/children/$childId", params: { childId: id } });
            } catch (e) {
              toast.error(friendlyError(e));
            }
          }}
        />
      </div>
    </div>
  );
}
