"use client";

import { useEffect } from "react";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { isNotaApiConfigured, isSupabaseConfigured } from "@/lib/config/api";
import { gameSessionManager } from "@/lib/session/gameSessionManager";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { subscribeToSession } from "@/realtime/sessionRealtime";
import { sessionStore, useSessionStore } from "@/stores/sessionStore";

/** Tracks per-session initial REST leaderboard load (handoff: fetch once, then Realtime only). */
const initialLeaderboardLoadedFor = new Set<string>();

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

      if (isNotaApiConfigured() && !initialLeaderboardLoadedFor.has(sessionId!)) {
        initialLeaderboardLoadedFor.add(sessionId!);
        void gameSessionManager.refreshLeaderboard();
      }
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

  useEffect(() => {
    if (!sessionId) return;
    return () => {
      initialLeaderboardLoadedFor.delete(sessionId);
    };
  }, [sessionId]);
}
