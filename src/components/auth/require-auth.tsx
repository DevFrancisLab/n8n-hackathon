import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { LoadingState } from "@/components/layout/page-status";
import { useAuth } from "@/lib/auth-context";

export function RequireAuth({ when = true, children }: { when?: boolean; children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!when) return children;
  if (!ready) return <LoadingState label="Checking your session..." />;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}
