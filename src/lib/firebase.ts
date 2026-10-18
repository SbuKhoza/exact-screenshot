import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApiKey } from "./firebase.functions";

// Firebase web config is publishable (not a secret): access is controlled by Firestore rules and
// by the authorized domains / HTTP referrer restrictions in the Firebase and Google Cloud consoles.
// Values come from VITE_FIREBASE_* env vars when present; otherwise they fall back to the shared
// project used by the CMS (cmshandybusiness) and the tenant sites (handybusiness), so the site
// still works when the host has no env vars configured.
const config = {
  apiKey: (import.meta.env["VITE_FIREBASE_API_KEY"] as string | undefined) || "AIzaSyAvrTy7m6OYqTkFD2ezu-gHXSCmrRNWqoI",
  authDomain: (import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] as string | undefined) || "business001-d42d8.firebaseapp.com",
  projectId: (import.meta.env["VITE_FIREBASE_PROJECT_ID"] as string | undefined) || "business001-d42d8",
  storageBucket: (import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"] as string | undefined) || "business001-d42d8.firebasestorage.app",
  messagingSenderId: (import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] as string | undefined) || "801149423209",
  appId: (import.meta.env["VITE_FIREBASE_APP_ID"] as string | undefined) || "1:801149423209:web:332a93c004c1585be55cf8",
};

export function firebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

let app: FirebaseApp | undefined;
let initPromise: Promise<boolean> | undefined;

/**
 * Ensure Firebase is ready. If the API key isn't in the env (it is stored as
 * a project secret), fetch it once from the server. Safe to call repeatedly.
 */
export function initFirebase(): Promise<boolean> {
  if (firebaseConfigured()) return Promise.resolve(true);
  initPromise ??= getFirebaseApiKey()
    .then((key) => {
      if (key) config.apiKey = key;
      return firebaseConfigured();
    })
    .catch(() => false);
  return initPromise;
}

/** Lazily initialise Firebase. Only call from the browser (effects / handlers). */
export function fb(): { auth: Auth; db: Firestore } {
  if (!firebaseConfigured()) throw new Error("FIREBASE_NOT_CONFIGURED");
  if (!app) app = getApps()[0] ?? initializeApp({ ...config, apiKey: config.apiKey! });
  return { auth: getAuth(app), db: getFirestore(app) };
}

export function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? (e as Error)?.message ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists. Try logging in instead.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/wrong-password": "The email or password is incorrect.",
    "auth/user-not-found": "The email or password is incorrect.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Please choose a stronger password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network problem. Check your connection and try again.",
    "auth/requires-recent-login": "Please log in again before making this change.",
    "permission-denied": "You don't have permission to do that.",
    unavailable: "We can't reach the server right now. Please try again.",
    FIREBASE_NOT_CONFIGURED: "Online registration isn't switched on yet. Please contact us directly.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}