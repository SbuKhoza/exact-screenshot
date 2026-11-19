# Tenant lesson register

Add an admin-managed tutoring register that stays isolated to each tenant.

## What will be built
- Add a lesson register area to the admin dashboard: choose enrolled learners, set a start date, enter a lesson plan, and save the register.
- Publish an optional virtual-class meeting link to only the selected learners; show their assigned plan and link in their own student dashboard.
- Let the admin record each learner's completion mark after every lesson, and show those marks to that learner.
- Extend Firestore rules so only the assigned tenant admin can create or change register records, and each signed-in learner can read only their own records.
- Add focused tests for learner ownership and lesson completion validation, then verify the preview and record the required Firestore-rules deployment step.

## Technical details
- Store one tenant-scoped Firestore register record per learner, with a shared register ID, start date, lesson list, completion marks, and optional meeting URL. This allows student queries to be constrained to their own UID without exposing classmates' personal data.
- The meeting link is delivered in the selected learners' signed-in dashboard; this project has no configured email delivery service.
