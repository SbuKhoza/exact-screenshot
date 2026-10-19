<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Backend is Firebase (user's explicit choice): Auth + Firestore, initialised lazily client-side in src/lib/firebase.ts from VITE_FIREBASE_* env; why: user requested Firebase over Lovable Cloud.
- Firestore security rules live in firestore.rules and must be deployed by the owner via Firebase console/CLI; why: authorisation is enforced server-side there, not in the UI.
- Editable company content and subject list live in src/lib/site.ts; why: owner updates branding/subjects in one place.
- Tenant admin access requires verified Firebase email matching the active tenant's superadmin-managed email and is enforced in Firestore rules; why: browser checks alone cannot authorize private data.
- Admin profiles are tenant subcollection documents; registrations and enquiries carry immutable tenantId fields and admin queries filter by them; why: administrators must never see another tenant's records or unassigned legacy records.
