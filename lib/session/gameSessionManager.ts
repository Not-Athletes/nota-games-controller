import { toBackendSessionConfig } from "@/lib/api/dashboard/sessionConfig";
import { mergeConnectedPlayers } from "@/lib/api/dashboard/schemas";
import { CURRENT_EVENT } from "@/lib/config/event";
import { isNotaApiConfigured } from "@/lib/config/api";
import type { GameStatePayload } from "@/lib/gameState/types";
import {
  configureGameStateSync,
  queueGameStateSync,
  resetGameStateSync,
  syncGameStateImmediate,
} from "@/lib/session/gameStateSync";
import { storeStatusFromBackendState, toBackendStatePatch } from "@/lib/session/backendGameState";
import { leaderboardService } from "@/services/leaderboard.service";
import { participantService } from "@/services/participant.service";
import { ApiError } from "@/services/api-client";
import { sessionService } from "@/services/session.service";
import { sessionStore } from "@/stores/sessionStore";
import type { SessionConfig } from "@/types/session";
import type { SessionStatePatch } from "@/lib/api/dashboard/schemas";

configureGameStateSync(async (sessionId, patch) => {
  await sessionService.patchState(sessionId, patch);
  updateStoreStatusFromPatch(patch);
});

function updateStoreStatusFromPatch(patch: SessionStatePatch) {
  if (patch.status === "ended") {
    sessionStore.setStatus("ended");
    return;
  }
  if (patch.status === "paused") {
    sessionStore.setStatus("paused");
    return;
  }
  if (patch.status === "active") {
    sessionStore.setStatus("active");
  }
}

/**
 * Conductor for backend session lifecycle. The workout clock stays in
 * SessionControllerContext; this layer issues REST commands and
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
        await sessionService.patchState(sessionId, { status: "ended" });
      } catch (error) {
        console.warn("Failed to end backend session", error);
        throw error;
      }
    }

    resetGameStateSync();
    sessionStore.reset();
  },

  syncGameState(payload: GameStatePayload) {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    const patch = toBackendStatePatch(payload);
    if (!patch) return;

    queueGameStateSync(sessionId, payload);
  },

  async syncGameStateNow(payload: GameStatePayload) {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) return;

    await syncGameStateImmediate(sessionId, payload);
  },

  applyRemoteGameState(state: Parameters<typeof storeStatusFromBackendState>[0]) {
    sessionStore.setStatus(storeStatusFromBackendState(state));
  },

  async end() {
    const { sessionId } = sessionStore.getState();
    if (!sessionId || !isNotaApiConfigured()) {
      sessionStore.setStatus("ended");
      return;
    }

    try {
      await sessionService.patchState(sessionId, { status: "ended", phase: "complete" });
      sessionStore.setStatus("ended");
    } catch (error) {
      console.warn("Failed to end backend session", error);
    }
  },

  reset() {
    resetGameStateSync();
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
