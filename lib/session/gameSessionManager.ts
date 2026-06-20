import { toBackendSessionConfig } from "@/lib/api/dashboard/sessionConfig";
import { mergeConnectedPlayers } from "@/lib/api/dashboard/schemas";
import { CURRENT_EVENT } from "@/lib/config/event";
import { isNotaApiConfigured } from "@/lib/config/api";
import { phaseToSessionStatus } from "@/lib/session/phaseStatus";
import { leaderboardService } from "@/services/leaderboard.service";
import { participantService } from "@/services/participant.service";
import { ApiError } from "@/services/api-client";
import { sessionService } from "@/services/session.service";
import { sessionStore } from "@/stores/sessionStore";
import type { SessionConfig, Phase } from "@/types/session";
import type { SessionStatus } from "@/types/session-api";

/**
 * Conductor for backend session lifecycle. The workout clock stays in
 * SessionControllerContext; this layer only issues REST commands and
 * keeps the session store aligned with backend events.
 */
export const gameSessionManager = {
  isEnabled() {
    return isNotaApiConfigured();
  },

  async createSession(config: SessionConfig) {
    if (!isNotaApiConfigured()) return;

    try {
      const session = await sessionService.createSession({
        title: CURRENT_EVENT.name,
        teamFormat: "solo",
        config: toBackendSessionConfig(config),
      });

      sessionStore.setSessionId(session.id);
      sessionStore.setStatus("draft");

      await gameSessionManager.refreshConnectedPlayers();
    } catch (error) {
      console.warn("Failed to create backend session", error);
      throw error;
    }
  },

  async disconnectSession() {
    const { sessionId, status } = sessionStore.getState();

    if (sessionId && isNotaApiConfigured() && status !== "ended") {
      try {
        await sessionService.transitionState(sessionId, "ended");
      } catch (error) {
        console.warn("Failed to end backend session", error);
        throw error;
      }
    }

    sessionStore.reset();
  },

  async transitionStatus(status: SessionStatus) {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    try {
      await sessionService.transitionState(sessionId, status);
      sessionStore.setStatus(status);
      if (status === "active") {
        await gameSessionManager.refreshLeaderboard();
      }
    } catch (error) {
      console.warn("Failed to transition session status", error);
    }
  },

  async syncFromPhase(phase: Phase, isPaused: boolean) {
    const status = phaseToSessionStatus(phase, isPaused);
    const { sessionId, status: currentStatus } = sessionStore.getState();
    if (!sessionId || status === currentStatus) return;
    await gameSessionManager.transitionStatus(status);
  },

  async end() {
    await gameSessionManager.transitionStatus("ended");
  },

  reset() {
    sessionStore.reset();
  },

  async refreshLeaderboard() {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    try {
      const leaderboard = await leaderboardService.fetchLeaderboard(sessionId);
      sessionStore.setLeaderboard(leaderboard);
    } catch (error) {
      console.warn("Failed to refresh leaderboard", error);
    }
  },

  async refreshConnectedPlayers() {
    const { sessionId, connectedPlayers } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    try {
      const joined = await participantService.fetchJoinedParticipants(sessionId);
      if (joined.length === 0) return;

      sessionStore.setConnectedPlayers(mergeConnectedPlayers(connectedPlayers, joined));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return;
      }
      console.warn("Failed to refresh connected players", error);
    }
  },
};
