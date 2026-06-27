"use client";

import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { hydrateSessionStoreFromStorage } from "@/stores/sessionStore";
import { useEffect, type ReactNode } from "react";

/**
 * Mounts Supabase Realtime for the active session (handoff: REST for commands,
 * Realtime for live scores/presence/state — no polling during a session).
 */
export function SessionOrchestrationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrateSessionStoreFromStorage();
  }, []);

  useSessionRealtime();
  return children;
}
