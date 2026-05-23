"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/auth/roles";
import {
  createSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";

type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseBrowserConfigured());
  const isConfigured = isSupabaseBrowserConfigured();

  const loadProfile = useCallback(async (nextUser: User | null) => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase || !nextUser) {
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, email, display_name, role, created_at, updated_at")
      .eq("user_id", nextUser.id)
      .maybeSingle();

    setProfile(
      data
        ? (data as UserProfile)
        : {
            display_name: nextUser.user_metadata?.display_name ?? null,
            email: nextUser.email ?? "",
            id: nextUser.id,
            role: "buyer",
            user_id: nextUser.id,
          },
    );
  }, []);

  const refreshAuth = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();

    setUser(nextUser);
    await loadProfile(nextUser);
    setIsLoading(false);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }
    const activeSupabase = supabase;

    let isActive = true;

    async function loadInitialUser() {
      const {
        data: { user: nextUser },
      } = await activeSupabase.auth.getUser();

      if (!isActive) {
        return;
      }

      setUser(nextUser);
      await loadProfile(nextUser);

      if (isActive) {
        setIsLoading(false);
      }
    }

    void loadInitialUser();

    const {
      data: { subscription },
    } = activeSupabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      void loadProfile(nextUser);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      isConfigured,
      isLoading,
      profile,
      refreshAuth,
      signOut,
      user,
    }),
    [isConfigured, isLoading, profile, refreshAuth, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
