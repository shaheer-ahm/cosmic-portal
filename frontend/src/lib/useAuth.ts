import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { apiFetch } from "./api";
import type { UserRole } from "../types/domain";

const roleCache = new Map<string, UserRole>();
const inFlight = new Map<string, Promise<UserRole>>();

function fetchRole(userId: string): Promise<UserRole> {
  const cached = roleCache.get(userId);
  if (cached) return Promise.resolve(cached);

  let pending = inFlight.get(userId);
  if (!pending) {
    pending = apiFetch<{ role: string }>("/auth/me")
      .then((me) => {
        const role = me.role.toLowerCase() as UserRole;
        roleCache.set(userId, role);
        return role;
      })
      .finally(() => inFlight.delete(userId));
    inFlight.set(userId, pending);
  }
  return pending;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const apply = async (next: Session | null) => {
      if (!active) return;
      setSession(next);

      if (!next?.user) {
        setRole("user");
        setLoading(false);
        return;
      }

      if (!roleCache.has(next.user.id)) setLoading(true);

      try {
        const resolved = await fetchRole(next.user.id);
        if (active) setRole(resolved);
      } catch (err) {
        console.error("Could not load user role:", err);
        if (active) setRole("user");
      } finally {
        if (active) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "SIGNED_OUT") roleCache.clear();
      setTimeout(() => apply(next), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, role, loading, user: session?.user ?? null };
}