import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/guard";

export function RequireAnyAuth({ children }: { children: ReactNode }) {
  const { loading, user, account } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && (!user || !account)) navigate({ to: "/login", replace: true });
  }, [loading, user, account, navigate]);
  if (loading || !user || !account) return <Spinner />;
  return <>{children}</>;
}
