"use client";

import { useEffect } from "react";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { isNotaApiConfigured, isSupabaseConfigured } from "@/lib/config/api";
import { gameSessionManager } from "@/lib/session/gameSessionManager";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { subscribeToSession } from "@/realtime/sessionRealtime";
import { sessionStore, useSessionStore } from "@/stores/sessionStore";

export function useSessionRealtime() {
  const sessionId = useSessionStore((state) => state.sessionId);

  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured()) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function connect() {
      unsubscribe?.();
      unsubscribe = undefined;

      const cleanup = await subscribeToSession(sessionId!, {
        onLeaderboardUpdate: (entries) => sessionStore.setLeaderboard(entries),
        onPresenceUpdate: (players) => sessionStore.setConnectedPlayers(players),
      });

      if (cancelled) {
        cleanup();
        return;
      }

      unsubscribe = cleanup;
      void gameSessionManager.refreshConnectedPlayers();
    }

    void connect();

    const supabase = getSupabaseBrowserClient();
    const authSubscription = supabase?.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void connect();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      authSubscription?.data.subscription.unsubscribe();
    };
  }, [sessionId]);
}

/** Poll joined participants when Realtime is unavailable or as a REST fallback. */
export function usePresencePolling() {
  const sessionId = useSessionStore((state) => state.sessionId);

  useEffect(() => {
    if (!sessionId || !isNotaApiConfigured()) return;

    void gameSessionManager.refreshConnectedPlayers();
    const interval = setInterval(() => {
      void gameSessionManager.refreshConnectedPlayers();
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);
}

/** Initial leaderboard fetch when API is configured but realtime is not. */
export function useLeaderboardPolling() {
  const sessionId = useSessionStore((state) => state.sessionId);

  useEffect(() => {
    if (!sessionId || !isNotaApiConfigured() || isSupabaseConfigured()) return;

    void gameSessionManager.refreshLeaderboard();
    const interval = setInterval(() => {
      void gameSessionManager.refreshLeaderboard();
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);
}
