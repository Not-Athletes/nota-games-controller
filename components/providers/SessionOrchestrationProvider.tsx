"use client";

import {
  useLeaderboardPolling,
  usePresencePolling,
  useSessionRealtime,
} from "@/hooks/useSessionRealtime";
import type { ReactNode } from "react";

/**
 * Mounts realtime subscriptions (and API polling fallback) for the active session.
 * Pages stay unaware of Supabase channels.
 */
export function SessionOrchestrationProvider({ children }: { children: ReactNode }) {
  useSessionRealtime();
  usePresencePolling();
  useLeaderboardPolling();
  return children;
}
