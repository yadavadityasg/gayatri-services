import { useEffect, useState } from "react";

export type AdminUser = { id: string; email: string; role: string };

export function useIsAdmin(refreshKey = 0) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data) => {
        if (cancelled) return;
        const next = (data.user ?? null) as AdminUser | null;
        setUser(next);
        setIsAdmin(next?.role === "admin");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { isAdmin, loading, user };
}
