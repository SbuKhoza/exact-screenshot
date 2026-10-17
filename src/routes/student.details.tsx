import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/forms";
import { RequireAuth, Spinner } from "@/components/guard";
import { LearnerForm, emptyLearner, type LearnerValues } from "@/components/learner-form";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/firebase";
import { getLearner, saveStudentDetails } from "@/lib/services";

export const Route = createFileRoute("/student/details")({
  head: () => ({ meta: [{ title: "Your Details — SS Academy" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth role="student" needsProfile={false}><Details /></RequireAuth>
  ),
});

function Details() {
  const { user, account, refresh } = useAuth();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<LearnerValues | null>(null);
  const editing = account?.profileCompleted;

  useEffect(() => {
    getLearner(user!.uid)
      .then((s) => setInitial(s ? { firstName: s.firstName, surname: s.surname, dateOfBirth: s.dateOfBirth, cellphone: s.cellphoneNumber, subjects: s.subjects, otherSubject: s.otherSubject, grade: s.grade, schoolName: s.schoolName } : emptyLearner))
      .catch(() => setInitial(emptyLearner));
  }, [user]);

  if (!initial) return <Spinner />;
  return (
    <AuthCard step={editing ? undefined : "Step 2 of 2"} title={editing ? "Edit your details" : "Your details"} subtitle={`Logged in as ${user?.email}`}>
      <LearnerForm
        mode="student"
        initial={initial}
        submitLabel={editing ? "Save changes" : "Complete registration"}
        onSubmit={async (v) => {
          try {
            await saveStudentDetails(user!.uid, user!.email!, v);
            await refresh();
            toast.success(editing ? "Details updated" : "Registration complete! We'll be in touch soon.");
            navigate({ to: "/student" });
          } catch (e) {
            toast.error(friendlyError(e));
          }
        }}
      />
    </AuthCard>
  );
}
