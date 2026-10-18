import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { fb, firebaseConfigured } from "./firebase";
import { getAccount, type Account } from "./services";

type AuthState = {
  loading: boolean;
  user: User | null;
  account: Account | null;
  refresh: () => Promise<Account | null>;
};

const Ctx = createContext<AuthState>({ loading: true, user: null, account: null, refresh: async () => null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    void initFirebase().then((ready) => {
      if (cancelled) return;
      if (!ready) {
        setLoading(false);
        return;
      }
      unsub = onAuthStateChanged(fb().auth, async (u) => {
      setLoading(true);
      setUser(u);
      try {
        setAccount(u ? await getAccount(u.uid) : null);
      } catch {
        setAccount(null);
      }
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    const u = firebaseConfigured ? fb().auth.currentUser : null;
    const a = u ? await getAccount(u.uid) : null;
    setAccount(a);
    return a;
  }, []);

  return <Ctx.Provider value={{ loading, user, account, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export function homeFor(a: Account | null): "/parent" | "/parent/profile" | "/student" | "/student/details" | "/register" {
  if (!a) return "/register";
  if (a.role === "parent") return a.profileCompleted ? "/parent" : "/parent/profile";
  return a.profileCompleted ? "/student" : "/student/details";
}
