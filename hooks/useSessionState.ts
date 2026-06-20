"use client";

import { useSessionStore } from "@/stores/sessionStore";
import { sessionStatusLabel } from "@/lib/session/phaseStatus";

export function useSessionState() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const status = useSessionStore((state) => state.status);
  const connectedPlayers = useSessionStore((state) => state.connectedPlayers);

  return {
    sessionId,
    status,
    statusLabel: sessionStatusLabel(status),
    connectedPlayers,
    connectedCount: connectedPlayers.length,
    totalCount: connectedPlayers.length,
  };
}
