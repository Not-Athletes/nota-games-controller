"use client";

import {
  useLeaderboardPolling,
  usePresencePolling,
  useSessionRealtime,
} from "@/hooks/useSessionRealtime";
import { hydrateSessionStoreFromStorage } from "@/stores/sessionStore";
import { useEffect, type ReactNode } from "react";

/**
 * Mounts realtime subscriptions (and API polling fallback) for the active session.
 * Pages stay unaware of Supabase channels.
 */
export function SessionOrchestrationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrateSessionStoreFromStorage();
  }, []);

  useSessionRealtime();
  usePresencePolling();
  useLeaderboardPolling();
  return children;
}
