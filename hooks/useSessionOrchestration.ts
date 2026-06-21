"use client";

import { gameSessionManager } from "@/lib/session/gameSessionManager";
import type { SessionConfig } from "@/types/session";
import { sessionService } from "@/services/session.service";
import { useSessionStore } from "@/stores/sessionStore";

export function useSessionOrchestration() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const backendEnabled = gameSessionManager.isEnabled();

  return {
    sessionId,
    backendEnabled,
    createSession: (config: SessionConfig) => gameSessionManager.createSession(config),
    disconnectSession: () => gameSessionManager.disconnectSession(),
    endSession: () => gameSessionManager.end(),
    resetSession: () => gameSessionManager.reset(),
    sessionService,
  };
}
