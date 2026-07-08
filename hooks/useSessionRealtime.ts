"use client";

import { useEffect } from "react";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/config/api";
import { gameSessionManager } from "@/lib/session/gameSessionManager";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { subscribeToSession } from "@/realtime/sessionRealtime";
import { sessionStore, useSessionStore } from "@/stores/sessionStore";

/** Tracks per-session initial REST loads (handoff: fetch once, then Realtime only). */
const initialLeaderboardLoadedFor = new Set<string>();
const initialParticipantTeamsLoadedFor = new Set<string>();
const initialConnectedPlayersLoadedFor = new Set<string>();

export function useSessionRealtime() {
  const sessionId = useSessionStore((state) => state.sessionId);

  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured()) return;

    sessionStore.clearPresenceState();

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function connect() {
      unsubscribe?.();
      unsubscribe = undefined;

      const cleanup = await subscribeToSession(sessionId!, {
        onLeaderboardUpdate: ({ entries, teams }) =>
          sessionStore.setLeaderboardFromRealtime(entries, teams),
        onPresenceUpdate: (players) => {
          sessionStore.setConnectedPlayers(players);
          void gameSessionManager.refreshParticipantTeamsIfNeeded(players);
        },
      });

      if (cancelled) {
        cleanup();
        return;
      }

      unsubscribe = cleanup;

      if (!initialLeaderboardLoadedFor.has(sessionId!)) {
        initialLeaderboardLoadedFor.add(sessionId!);
        void gameSessionManager.refreshLeaderboard();
      }

      if (!initialParticipantTeamsLoadedFor.has(sessionId!)) {
        initialParticipantTeamsLoadedFor.add(sessionId!);
        void gameSessionManager.refreshParticipantTeams();
      }

      if (!initialConnectedPlayersLoadedFor.has(sessionId!)) {
        initialConnectedPlayersLoadedFor.add(sessionId!);
        void gameSessionManager.refreshConnectedPlayers();
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
      initialParticipantTeamsLoadedFor.delete(sessionId);
      initialConnectedPlayersLoadedFor.delete(sessionId);
    };
  }, [sessionId]);
}
