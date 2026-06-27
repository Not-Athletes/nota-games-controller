"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { isNotaApiConfigured, isSupabaseConfigured } from "@/lib/config/api";
import { getVerifiedUser } from "@/lib/supabase/auth-helpers";
import { getSupabaseBrowserClient, syncSupabaseRealtimeAuth } from "@/lib/supabase/browser";

type NotaAuthStatus = {
  authenticated: boolean;
  email: string | null;
  source: "env" | "supabase" | null;
  loading: boolean;
  error: string | null;
};

async function readVerifiedAuthState() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { authenticated: false, email: null as string | null };
  }

  const user = await getVerifiedUser(supabase);
  if (user) {
    await syncSupabaseRealtimeAuth();
  }

  return {
    authenticated: Boolean(user),
    email: user?.email ?? null,
  };
}

export function useNotaAuth() {
  const [status, setStatus] = useState<NotaAuthStatus>({
    authenticated: false,
    email: null,
    source: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!isNotaApiConfigured()) {
      setStatus({
        authenticated: true,
        email: null,
        source: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      const sessionResponse = await fetch("/api/auth/nota/session");
      const sessionData = (await sessionResponse.json()) as {
        authenticated?: boolean;
        email?: string | null;
        source?: "env" | "supabase";
      };

      if (sessionData.source === "env" && sessionData.authenticated) {
        setStatus({
          authenticated: true,
          email: null,
          source: "env",
          loading: false,
          error: null,
        });
        return;
      }

      if (isSupabaseConfigured()) {
        const verified = await readVerifiedAuthState();
        setStatus({
          authenticated: verified.authenticated,
          email: verified.email,
          source: verified.authenticated ? "supabase" : null,
          loading: false,
          error: null,
        });
        return;
      }

      setStatus({
        authenticated: Boolean(sessionData.authenticated),
        email: sessionData.email ?? null,
        source: sessionData.authenticated ? "supabase" : null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not check sign-in status";
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent) => {
      void readVerifiedAuthState().then((verified) => {
        setStatus({
          authenticated: verified.authenticated,
          email: verified.email,
          source: verified.authenticated ? "supabase" : null,
          loading: false,
          error: null,
        });
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (input: { email?: string; password?: string }) => {
      setStatus((prev) => ({ ...prev, loading: true, error: null }));

      try {
        if (!isSupabaseConfigured()) {
          throw new Error("Sign-in is not configured");
        }

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          throw new Error("Sign-in is not available");
        }

        const email = input.email?.trim();
        const password = input.password?.trim();
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw new Error(error.message);
        }

        const verified = await readVerifiedAuthState();
        setStatus({
          authenticated: verified.authenticated,
          email: verified.email,
          source: verified.authenticated ? "supabase" : null,
          loading: false,
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sign-in failed";
        setStatus((prev) => ({ ...prev, loading: false, error: message }));
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    await refresh();
  }, [refresh]);

  return {
    ...status,
    requiresAuth: isNotaApiConfigured() && isSupabaseConfigured(),
    signIn,
    signOut,
    refresh,
  };
}
