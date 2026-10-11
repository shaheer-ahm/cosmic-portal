import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { UserRole } from "../types/domain";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        // Reads role from app_metadata or user_metadata set by Supabase/FastAPI
        const userRole = (session.user.app_metadata?.role || session.user.user_metadata?.role || "user") as UserRole;
        setRole(userRole);
      }
      setLoading(false);
    };

    fetchSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const userRole = (session.user.app_metadata?.role || session.user.user_metadata?.role || "user") as UserRole;
        setRole(userRole);
      } else {
        setRole("user");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, role, loading, user: session?.user ?? null };
}